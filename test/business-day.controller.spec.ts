import { Test, TestingModule } from '@nestjs/testing';
import { BusinessDayController } from '../src/controllers/business-day.controller';
import { BusinessDayService } from '../src/services/business-day.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('BusinessDayController', () => {
  let controller: BusinessDayController;
  let service: BusinessDayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessDayController],
      providers: [
        {
          provide: BusinessDayService,
          useValue: {
            calculateBusinessDateTime: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BusinessDayController>(BusinessDayController);
    service = module.get<BusinessDayService>(BusinessDayService);
  });

  describe('calculateBusinessDays', () => {
    it('should return calculated date when valid parameters provided', async () => {
      const mockResult = '2025-08-01T14:00:00.000Z';
      jest
        .spyOn(service, 'calculateBusinessDateTime')
        .mockResolvedValue(mockResult);

      const result = await controller.calculateBusinessDays({
        days: 5,
        hours: 2,
      });

      expect(result).toEqual({
        date: mockResult,
      });
      expect(service.calculateBusinessDateTime).toHaveBeenCalledWith(
        5,
        2,
        undefined,
      );
    });

    it('should throw error when no parameters provided', async () => {
      await expect(controller.calculateBusinessDays({})).rejects.toThrow(
        HttpException,
      );
    });

    it('should work with only days parameter', async () => {
      const mockResult = '2025-08-01T14:00:00.000Z';
      jest
        .spyOn(service, 'calculateBusinessDateTime')
        .mockResolvedValue(mockResult);

      const result = await controller.calculateBusinessDays({
        days: 3,
      });

      expect(result).toEqual({
        date: mockResult,
      });
      expect(service.calculateBusinessDateTime).toHaveBeenCalledWith(
        3,
        undefined,
        undefined,
      );
    });

    it('should work with only hours parameter', async () => {
      const mockResult = '2025-08-01T14:00:00.000Z';
      jest
        .spyOn(service, 'calculateBusinessDateTime')
        .mockResolvedValue(mockResult);

      const result = await controller.calculateBusinessDays({
        hours: 8,
      });

      expect(result).toEqual({
        date: mockResult,
      });
      expect(service.calculateBusinessDateTime).toHaveBeenCalledWith(
        undefined,
        8,
        undefined,
      );
    });

    it('should handle date parameter correctly', async () => {
      const mockResult = '2025-08-01T14:00:00.000Z';
      const inputDate = '2025-07-01T10:00:00Z';
      jest
        .spyOn(service, 'calculateBusinessDateTime')
        .mockResolvedValue(mockResult);

      const result = await controller.calculateBusinessDays({
        days: 1,
        date: inputDate,
      });

      expect(result).toEqual({
        date: mockResult,
      });
      expect(service.calculateBusinessDateTime).toHaveBeenCalledWith(
        1,
        undefined,
        inputDate,
      );
    });

    it('should handle service errors gracefully', async () => {
      jest
        .spyOn(service, 'calculateBusinessDateTime')
        .mockRejectedValue(new Error('Service error'));

      await expect(
        controller.calculateBusinessDays({
          days: 1,
        }),
      ).rejects.toThrow(HttpException);
    });
  });
});
