import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { BusinessDayErrorCode } from '../constants';

/**
 * Crea una instancia configurada de ValidationPipe consistente para todas las entradas (standalone, Vercel, Lambda).
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => {
      const messages = errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .join('; ');
      return new HttpException(
        {
          error: BusinessDayErrorCode.INVALID_PARAMETERS,
          message: `Validation failed: ${messages}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    },
  });
}
