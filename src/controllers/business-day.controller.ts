import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { BusinessDayService } from '../services/business-day.service';
import {
  BusinessDayQueryDto,
  BusinessDayResponse,
  ErrorResponse,
} from '../types';

@Controller('business-days')
export class BusinessDayController {
  private readonly logger = new Logger(BusinessDayController.name);

  constructor(private readonly businessDayService: BusinessDayService) {}

  @Get('calculate')
  async calculateBusinessDays(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
          const messages = errors
            .map((error) => Object.values(error.constraints || {}).join(', '))
            .join('; ');

          return new HttpException(
            {
              error: 'InvalidParameters',
              message: `Validation failed: ${messages}`,
            } as ErrorResponse,
            HttpStatus.BAD_REQUEST,
          );
        },
      }),
    )
    query: BusinessDayQueryDto,
  ): Promise<BusinessDayResponse> {
    try {
      // Validate that at least one parameter (days or hours) is provided
      if (!query.days && !query.hours) {
        throw new HttpException(
          {
            error: 'InvalidParameters',
            message: 'At least one parameter (days or hours) must be provided',
          } as ErrorResponse,
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `Calculating business days with params: ${JSON.stringify(query)}`,
      );

      const resultDate =
        await this.businessDayService.calculateBusinessDateTime(
          query.days,
          query.hours,
          query.date,
        );

      return {
        date: resultDate,
      };
    } catch (error) {
      this.logger.error('Error calculating business days', error);

      // Re-throw HttpExceptions (validation errors, service unavailable, etc.)
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle unexpected errors
      throw new HttpException(
        {
          error: 'InternalServerError',
          message:
            'An unexpected error occurred while calculating business days',
        } as ErrorResponse,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
