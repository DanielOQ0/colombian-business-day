import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BusinessDayService } from '../services/business-day.service';
import {
  BusinessDayQueryDto,
  BusinessDayResponse,
  ErrorResponse,
} from '../types/globals';
import {
  BusinessDayErrorCode,
  ERROR_MESSAGES,
  LOG_MESSAGES,
} from '../constants/index';

/**
 * Controlador REST para el cálculo de días y horas laborales en Colombia.
 * Proporciona endpoints para calcular fechas futuras considerando horarios laborales,
 * fines de semana y festivos oficiales colombianos.
 */
@Controller('business-days')
export class BusinessDayController {
  private readonly logger = new Logger(BusinessDayController.name);

  constructor(private readonly businessDayService: BusinessDayService) {}

  /**
   * Endpoint para calcular una fecha futura agregando días y/o horas laborales.
   *
   * @route GET /business-days/calculate
   * @param query - Parámetros de consulta validados
   * @param query.days - Número de días laborales a agregar (opcional, debe ser entero positivo)
   * @param query.hours - Número de horas laborales a agregar (opcional, debe ser entero positivo)
   * @param query.date - Fecha inicial en formato ISO 8601 UTC (opcional, por defecto usa fecha actual)
   * @returns Promise que resuelve a un objeto con la fecha calculada en formato ISO 8601 UTC
   *
   * @throws {HttpException} 400 - InvalidParameters: Si no se proporciona al menos un parámetro (days o hours)
   * @throws {HttpException} 400 - InvalidParameters: Si los parámetros no pasan la validación
   * @throws {HttpException} 503 - ServiceUnavailable: Si no se pueden obtener los festivos colombianos
   * @throws {HttpException} 500 - InternalServerError: Para errores inesperados
   */
  @Get('calculate')
  async calculateBusinessDays(
    @Query() query: BusinessDayQueryDto,
  ): Promise<BusinessDayResponse> {
    try {
      // Validate that at least one parameter (days or hours) is provided
      if (!query.days && !query.hours) {
        throw new HttpException(
          {
            error: BusinessDayErrorCode.INVALID_PARAMETERS,
            message: ERROR_MESSAGES[BusinessDayErrorCode.INVALID_PARAMETERS],
          } as ErrorResponse,
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        LOG_MESSAGES.BUSINESS_DAY_CALCULATION_PARAMS(
          query as Record<string, unknown>,
        ),
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
      this.logger.error(LOG_MESSAGES.ERROR_CALCULATING_BUSINESS_DAYS, error);

      if (error instanceof HttpException) {
        throw error;
      }

      // Handle unexpected errors
      throw new HttpException(
        {
          error: BusinessDayErrorCode.INTERNAL_SERVER_ERROR,
          message: ERROR_MESSAGES[BusinessDayErrorCode.INTERNAL_SERVER_ERROR],
        } as ErrorResponse,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
