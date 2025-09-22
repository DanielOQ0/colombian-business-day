import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import {
  CACHE_CONFIG,
  BusinessDayErrorCode,
  ERROR_MESSAGES,
  LOG_MESSAGES,
} from '../constants/index';

@Injectable()
export class HolidayService {
  private readonly logger = new Logger(HolidayService.name);
  private holidaysCache: Set<string> = new Set();
  private lastFetchDate: Date | null = null;
  private readonly CACHE_EXPIRY_HOURS = CACHE_CONFIG.EXPIRY_HOURS;
  private readonly HOLIDAYS_URL =
    process.env.HOLIDAYS_API_URL ||
    'https://content.capta.co/Recruitment/WorkingDays.json';
  private fetchPromise: Promise<void> | null = null; // Prevenir múltiples llamadas concurrentes

  /**
   * Obtiene la lista de festivos oficiales colombianos desde una fuente externa.
   * Implementa caché con expiración de 24 horas para optimizar rendimiento.
   *
   * @returns Promise que resuelve a un Set con las fechas de festivos en formato 'yyyy-MM-dd'
   * @throws HttpException con estado SERVICE_UNAVAILABLE si no se pueden obtener los festivos
   *         y no hay datos en caché disponibles
   */
  async getColombianHolidays(): Promise<Set<string>> {
    if (this.shouldRefreshCache()) {
      // Prevenir múltiples llamadas concurrentes
      if (!this.fetchPromise) {
        this.fetchPromise = this.fetchHolidays().finally(() => {
          this.fetchPromise = null;
        });
      }
      await this.fetchPromise;
    }
    return this.holidaysCache;
  }

  /**
   * Determina si es necesario actualizar el caché de festivos basándose en criterios de tiempo.
   *
   * @returns true si se debe refrescar el caché, false en caso contrario
   *
   * Criterios para refrescar:
   * - No existe fecha de última actualización
   * - El caché está vacío
   * - Han pasado más de 24 horas desde la última actualización
   */
  private shouldRefreshCache(): boolean {
    if (!this.lastFetchDate || this.holidaysCache.size === 0) {
      return true;
    }

    const now = new Date();
    const hoursDiff =
      (now.getTime() - this.lastFetchDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= this.CACHE_EXPIRY_HOURS;
  }

  /**
   * Obtiene los festivos colombianos desde la API externa y actualiza el caché local.
   * Maneja errores de red y valida la respuesta antes de actualizar el caché.
   *
   * @returns Promise<void> que se resuelve cuando se completa la actualización del caché
   * @throws HttpException si no se pueden obtener los festivos y no hay caché disponible
   *
   * Comportamiento ante errores:
   * - Si hay caché disponible: registra el error pero continúa con datos en caché
   * - Si no hay caché: lanza excepción SERVICE_UNAVAILABLE
   * - Timeout configurado en 5 segundos para evitar bloqueos
   */
  private async fetchHolidays(): Promise<void> {
    try {
      this.logger.log(LOG_MESSAGES.HOLIDAYS_FETCH_START);
      const response: AxiosResponse<string[]> = await axios.get(
        this.HOLIDAYS_URL,
        {
          timeout: CACHE_CONFIG.TIMEOUT_MS,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'colombian-business-day-api/1.0.0',
          },
        },
      );

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected array of holidays');
      }

      this.holidaysCache.clear();

      response.data.forEach((dateStr: string) => {
        if (dateStr && typeof dateStr === 'string') {
          this.holidaysCache.add(dateStr);
        }
      });

      this.lastFetchDate = new Date();
      this.logger.log(LOG_MESSAGES.HOLIDAYS_CACHED(this.holidaysCache.size));
    } catch (error) {
      this.logger.error(LOG_MESSAGES.HOLIDAYS_FETCH_ERROR, error);

      if (this.holidaysCache.size === 0) {
        // Si no tenemos datos en caché y la petición falla, lanzar error
        throw new HttpException(
          {
            error: BusinessDayErrorCode.SERVICE_UNAVAILABLE,
            message: ERROR_MESSAGES[BusinessDayErrorCode.SERVICE_UNAVAILABLE],
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Si tenemos datos en caché, registrar el error pero continuar con datos en caché
      this.logger.warn(LOG_MESSAGES.HOLIDAYS_USING_CACHE);
    }
  }

  /**
   * Verifica si una fecha específica es un festivo oficial colombiano.
   * Utiliza el caché interno para la verificación.
   *
   * @param dateStr - Fecha en formato 'yyyy-MM-dd' a verificar
   * @returns true si la fecha es un festivo, false en caso contrario
   *
   * @example
   * isHoliday('2025-01-01'); // true para Año Nuevo
   * isHoliday('2025-01-02'); // false para día regular
   *
   * @note Esta función no actualiza el caché. Use getColombianHolidays() primero
   *       para asegurar que el caché esté actualizado.
   */
  isHoliday(dateStr: string): boolean {
    return this.holidaysCache.has(dateStr);
  }
}
