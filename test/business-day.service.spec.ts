import { Test, TestingModule } from '@nestjs/testing';
import { BusinessDayService } from '../src/services/business-day.service';
import { HolidayService } from '../src/services/holiday.service';
import { DateTime } from 'luxon';

describe('BusinessDayService', () => {
  let service: BusinessDayService;
  let holidayService: HolidayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessDayService,
        {
          provide: HolidayService,
          useValue: {
            getColombianHolidays: jest.fn().mockResolvedValue(
              new Set([
                '2025-01-01', // Año Nuevo
                '2025-12-25', // Navidad
              ]),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<BusinessDayService>(BusinessDayService);
    holidayService = module.get<HolidayService>(HolidayService);
  });

  describe('calculateBusinessDateTime', () => {
    it('should add business days correctly', async () => {
      // Iniciar el lunes 2025-08-04 a las 10:00 AM hora de Colombia
      const startDate = '2025-08-04T15:00:00Z'; // 10:00 AM hora de Colombia
      const result = await service.calculateBusinessDateTime(
        5,
        undefined,
        startDate,
      );

      // Debería agregar 5 días laborales (Lun-Vie), el resultado debería ser el siguiente lunes
      expect(result).toBe('2025-08-11T15:00:00.000Z');
    });

    it('should add business hours correctly', async () => {
      // Iniciar el lunes 2025-08-04 a las 10:00 AM hora de Colombia
      const startDate = '2025-08-04T15:00:00Z'; // 10:00 AM hora de Colombia
      const result = await service.calculateBusinessDateTime(
        undefined,
        2,
        startDate,
      );

      // Debería agregar 2 horas, el resultado debería ser 12:00 PM hora de Colombia
      const expectedDate = DateTime.fromISO('2025-08-04T17:00:00Z');
      expect(result).toBe(expectedDate.toISO());
    });

    it('should handle lunch break correctly when adding hours', async () => {
      // Iniciar a las 11:30 AM hora de Colombia
      const startDate = '2025-08-04T16:30:00Z'; // 11:30 AM hora de Colombia
      const result = await service.calculateBusinessDateTime(
        undefined,
        2,
        startDate,
      );

      // Debería agregar 30 minutos hasta el almuerzo, luego saltar el almuerzo, luego agregar 1.5 horas
      // El resultado debería ser 2:30 PM hora de Colombia
      const expectedDate = DateTime.fromISO('2025-08-04T19:30:00Z');
      expect(result).toBe(expectedDate.toISO());
    });

    it('should skip weekends when adding days', async () => {
      // Iniciar el viernes 2025-08-01 a las 10:00 AM hora de Colombia
      const startDate = '2025-08-01T15:00:00Z'; // 10:00 AM hora de Colombia
      const result = await service.calculateBusinessDateTime(
        1,
        undefined,
        startDate,
      );

      // Debería saltar el fin de semana y llegar al lunes
      const expectedDate = DateTime.fromISO('2025-08-04T15:00:00Z');
      expect(result).toBe(expectedDate.toISO());
    });

    it('should adjust time before business hours to 8:00 AM', async () => {
      // Iniciar a las 6:00 AM hora de Colombia
      const startDate = '2025-08-04T11:00:00Z'; // 6:00 AM hora de Colombia
      const result = await service.calculateBusinessDateTime(
        undefined,
        1,
        startDate,
      );

      // Debería ajustar a las 8:00 AM, luego agregar 1 hora para obtener 9:00 AM
      const expectedDate = DateTime.fromISO('2025-08-04T14:00:00Z');
      expect(result).toBe(expectedDate.toISO());
    });

    it('should adjust time after business hours to next business day', async () => {
      // Iniciar a las 6:00 PM hora de Colombia
      const startDate = '2025-08-04T23:00:00Z'; // 6:00 PM hora de Colombia
      const result = await service.calculateBusinessDateTime(
        undefined,
        1,
        startDate,
      );

      // Debería mover al siguiente día a las 8:00 AM, luego agregar 1 hora para obtener 9:00 AM
      const expectedDate = DateTime.fromISO('2025-08-05T14:00:00Z');
      expect(result).toBe(expectedDate.toISO());
    });

    it('should handle combination of days and hours', async () => {
      // Start on Monday 2025-08-04 at 10:00 AM Colombia time
      const startDate = '2025-08-04T15:00:00Z'; // 10:00 AM Colombia time
      const result = await service.calculateBusinessDateTime(1, 2, startDate);

      // Should add 1 day first (Tuesday), then add 2 hours (12:00 PM)
      const expectedDate = DateTime.fromISO('2025-08-05T17:00:00Z');
      expect(result).toBe(expectedDate.toISO());
    });

    it('should use current time when no date provided', async () => {
      const result = await service.calculateBusinessDateTime(undefined, 1);

      // Should return a valid ISO string
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should skip holidays when adding days', async () => {
      // Mock a holiday on 2025-08-05 (Tuesday)
      jest
        .spyOn(holidayService, 'getColombianHolidays')
        .mockResolvedValue(new Set(['2025-08-05']));

      // Start on Monday 2025-08-04 at 10:00 AM Colombia time
      const startDate = '2025-08-04T15:00:00Z'; // 10:00 AM Colombia time
      const result = await service.calculateBusinessDateTime(
        1,
        undefined,
        startDate,
      );

      // Should skip Tuesday (holiday) and land on Wednesday
      const expectedDate = DateTime.fromISO('2025-08-06T15:00:00Z');
      expect(result).toBe(expectedDate.toISO());
    });

    it('should handle weekend start date', async () => {
      // Start on Saturday 2025-08-02 at 10:00 AM Colombia time
      const startDate = '2025-08-02T15:00:00Z'; // 10:00 AM Colombia time
      const result = await service.calculateBusinessDateTime(
        undefined,
        1,
        startDate,
      );

      // Should move to Monday 8:00 AM, then add 1 hour to get 9:00 AM
      const expectedDate = DateTime.fromISO('2025-08-04T14:00:00Z');
      expect(result).toBe(expectedDate.toISO());
    });
  });
});
