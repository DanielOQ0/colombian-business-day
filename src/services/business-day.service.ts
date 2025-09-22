import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { HolidayService } from './holiday.service';
import { WORKING_HOURS, COLOMBIA_TIMEZONE } from '../constants';

@Injectable()
export class BusinessDayService {
  private readonly logger = new Logger(BusinessDayService.name);

  constructor(private readonly holidayService: HolidayService) {}

  /**
   * Calcula una fecha y hora futuras agregando días y/o horas laborales a partir de una fecha inicial.
   * Considera horarios laborales colombianos, fines de semana y festivos oficiales.
   *
   * @param days - Número de días laborales a agregar (opcional)
   * @param hours - Número de horas laborales a agregar (opcional)
   * @param startDate - Fecha inicial en formato ISO 8601 UTC (opcional, por defecto usa fecha actual)
   * @returns Promise que resuelve a una fecha en formato ISO 8601 UTC
   * @throws Error si no se especifican días ni horas
   */
  async calculateBusinessDateTime(
    days?: number,
    hours?: number,
    startDate?: string,
  ): Promise<string> {
    // Obtener fecha actual en zona horaria de Colombia o parsear fecha proporcionada
    let currentDateTime = startDate
      ? DateTime.fromISO(startDate, { zone: 'utc' }).setZone(COLOMBIA_TIMEZONE)
      : DateTime.now().setZone(COLOMBIA_TIMEZONE);

    this.logger.log(
      `Starting calculation from: ${currentDateTime.toISO()} (Colombia time)`,
    );

    // Ajustar a la hora laboral más cercana si está fuera del horario de trabajo
    currentDateTime = await this.adjustToNearestBusinessTime(currentDateTime);

    // Agregar días laborales primero
    if (days && days > 0) {
      currentDateTime = await this.addBusinessDays(currentDateTime, days);
    }

    // Luego agregar horas laborales
    if (hours && hours > 0) {
      currentDateTime = await this.addBusinessHours(currentDateTime, hours);
    }

    // Convertir de vuelta a UTC para la respuesta
    const resultUTC = currentDateTime.toUTC().toISO();
    this.logger.log(`Final result: ${resultUTC} (UTC)`);

    return resultUTC!;
  }

  /**
   * Ajusta una fecha y hora al horario laboral más cercano hacia atrás.
   * Si la fecha cae en fin de semana, festivo o fuera del horario laboral,
   * la mueve al último momento laboral válido anterior.
   *
   * @param dateTime - Fecha y hora a ajustar en zona horaria de Colombia
   * @returns Promise que resuelve a la fecha ajustada al horario laboral más cercano
   *
   * Reglas de ajuste:
   * - Fin de semana/festivo: mueve al día laboral anterior a las 5:00 PM
   * - Antes de 8:00 AM: mueve al día laboral anterior a las 5:00 PM
   * - Después de 5:00 PM: mueve a las 5:00 PM del mismo día
   * - Durante almuerzo (12:00-1:00 PM): mueve a las 12:00 PM del mismo día
   * - En horario laboral: no cambia
   */
  private async adjustToNearestBusinessTime(
    dateTime: DateTime,
  ): Promise<DateTime> {
    const holidays = await this.holidayService.getColombianHolidays();

    // Si es fin de semana o festivo, mover al día laboral anterior a las 5 PM
    while (this.isWeekend(dateTime) || this.isHoliday(dateTime, holidays)) {
      dateTime = dateTime.minus({ days: 1 }).set({
        hour: WORKING_HOURS.end,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    }

    // Si está fuera del horario laboral, ajustar a la hora laboral anterior más cercana
    const hour = dateTime.hour;

    if (hour < WORKING_HOURS.start) {
      // Antes de las 8:00 AM - mover a las 5:00 PM del día laboral anterior
      let prevDay = dateTime.minus({ days: 1 }).set({
        hour: WORKING_HOURS.end,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      // Asegurar que el día anterior también sea un día laboral
      while (this.isWeekend(prevDay) || this.isHoliday(prevDay, holidays)) {
        prevDay = prevDay.minus({ days: 1 });
      }

      return prevDay;
    } else if (hour >= WORKING_HOURS.end) {
      // Después de las 5:00 PM - mover a las 5:00 PM del mismo día
      return dateTime.set({
        hour: WORKING_HOURS.end,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    } else if (
      hour >= WORKING_HOURS.lunchStart &&
      hour < WORKING_HOURS.lunchEnd
    ) {
      // Durante el almuerzo (12:00-1:00 PM) - mover a las 12:00 PM del mismo día
      return dateTime.set({
        hour: WORKING_HOURS.lunchStart,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    }
    return dateTime;
  }

  /**
   * Agrega días laborales a una fecha específica, saltando fines de semana y festivos.
   * Solo cuenta días de lunes a viernes que no sean festivos oficiales colombianos.
   *
   * @param startDateTime - Fecha inicial desde la cual empezar a contar
   * @param daysToAdd - Número de días laborales a agregar (debe ser positivo)
   * @returns Promise que resuelve a la fecha resultante después de agregar los días laborales
   */
  private async addBusinessDays(
    startDateTime: DateTime,
    daysToAdd: number,
  ): Promise<DateTime> {
    const holidays = await this.holidayService.getColombianHolidays();
    let currentDateTime = startDateTime;
    let remainingDays = daysToAdd;

    while (remainingDays > 0) {
      currentDateTime = currentDateTime.plus({ days: 1 });

      // Verificar si es un día laboral
      if (
        !this.isWeekend(currentDateTime) &&
        !this.isHoliday(currentDateTime, holidays)
      ) {
        remainingDays--;
      }
    }

    return currentDateTime;
  }

  /**
   * Agrega horas laborales a una fecha específica, considerando horarios de trabajo y descansos.
   * Las horas laborales son de 8:00 AM a 12:00 PM y de 1:00 PM a 5:00 PM (8 horas total por día).
   * Salta automáticamente los fines de semana, festivos y el período de almuerzo.
   *
   * @param startDateTime - Fecha y hora inicial desde la cual empezar a contar
   * @param hoursToAdd - Número de horas laborales a agregar (debe ser positivo)
   * @returns Promise que resuelve a la fecha y hora resultante después de agregar las horas laborales
   *
   * Comportamiento:
   * - Cuenta solo horas dentro del horario laboral (8AM-12PM, 1PM-5PM)
   * - Salta automáticamente el almuerzo (12PM-1PM)
   * - Si las horas se extienden más allá del día laboral actual, continúa en el siguiente día laboral
   * - Excluye fines de semana y festivos colombianos
   */
  private async addBusinessHours(
    startDateTime: DateTime,
    hoursToAdd: number,
  ): Promise<DateTime> {
    const holidays = await this.holidayService.getColombianHolidays();
    let currentDateTime = startDateTime;
    let remainingMinutes = hoursToAdd * 60;

    while (remainingMinutes > 0) {
      // Asegurar que estamos en un día laboral
      while (
        this.isWeekend(currentDateTime) ||
        this.isHoliday(currentDateTime, holidays)
      ) {
        currentDateTime = currentDateTime.plus({ days: 1 }).set({
          hour: WORKING_HOURS.start,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
      }

      const currentHour = currentDateTime.hour;

      // Calcular minutos restantes en el período laboral actual
      let minutesToEndOfPeriod: number;

      if (currentHour < WORKING_HOURS.lunchStart) {
        // Período de la mañana (8:00 AM - 12:00 PM)
        const endOfMorning = currentDateTime.set({
          hour: WORKING_HOURS.lunchStart,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        minutesToEndOfPeriod = endOfMorning.diff(
          currentDateTime,
          'minutes',
        ).minutes;
      } else if (currentHour >= WORKING_HOURS.lunchEnd) {
        // Período de la tarde (1:00 PM - 5:00 PM)
        const endOfAfternoon = currentDateTime.set({
          hour: WORKING_HOURS.end,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        minutesToEndOfPeriod = endOfAfternoon.diff(
          currentDateTime,
          'minutes',
        ).minutes;
      } else {
        // Durante el descanso de almuerzo - saltar a la 1:00 PM
        currentDateTime = currentDateTime.set({
          hour: WORKING_HOURS.lunchEnd,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        continue;
      }

      if (remainingMinutes <= minutesToEndOfPeriod) {
        // Podemos terminar dentro de este período
        return currentDateTime.plus({ minutes: remainingMinutes });
      } else {
        // Mover al siguiente período laboral
        remainingMinutes -= minutesToEndOfPeriod;

        if (currentHour < WORKING_HOURS.lunchStart) {
          // Saltar al período de la tarde (1:00 PM)
          currentDateTime = currentDateTime.set({
            hour: WORKING_HOURS.lunchEnd,
            minute: 0,
            second: 0,
            millisecond: 0,
          });
        } else {
          // Mover a la mañana del siguiente día laboral (8:00 AM)
          currentDateTime = currentDateTime.plus({ days: 1 }).set({
            hour: WORKING_HOURS.start,
            minute: 0,
            second: 0,
            millisecond: 0,
          });
        }
      }
    }

    return currentDateTime;
  }

  /**
   * Determina si una fecha específica cae en fin de semana.
   *
   * @param dateTime - Fecha a verificar
   * @returns true si es sábado (6) o domingo (7), false en caso contrario
   */
  private isWeekend(dateTime: DateTime): boolean {
    const weekday = dateTime.weekday;
    return weekday === 6 || weekday === 7;
  }

  /**
   * Determina si una fecha específica es un festivo oficial colombiano.
   *
   * @param dateTime - Fecha a verificar
   * @param holidays - Set con las fechas de festivos en formato 'yyyy-MM-dd'
   * @returns true si la fecha es un festivo, false en caso contrario
   */
  private isHoliday(dateTime: DateTime, holidays: Set<string>): boolean {
    const dateStr = dateTime.toFormat('yyyy-MM-dd');
    return holidays.has(dateStr);
  }
}
