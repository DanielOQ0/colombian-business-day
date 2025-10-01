import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponse } from '../types/globals';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // Obtener la respuesta del error
    const exceptionResponse = exception.getResponse();

    let errorResponse: ErrorResponse;

    // Si ya es un ErrorResponse válido (desde nuestro código), usarlo directamente
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'error' in exceptionResponse &&
      'message' in exceptionResponse &&
      !('statusCode' in exceptionResponse)
    ) {
      errorResponse = exceptionResponse as ErrorResponse;
    } else {
      // Para errores de NestJS (como 404), crear una respuesta estándar
      if (status === 404) {
        errorResponse = {
          error: 'NotFound',
          message: 'Route not found',
        };
      } else if (status === 400) {
        // Para errores de validación de class-validator
        if (
          typeof exceptionResponse === 'object' &&
          exceptionResponse !== null &&
          'message' in exceptionResponse
        ) {
          // Type guard más seguro para el mensaje
          const responseObj = exceptionResponse as Record<string, unknown>;
          const messages = responseObj.message;
          let message: string;

          if (Array.isArray(messages) && messages.length > 0) {
            // Tomar solo el primer mensaje de error para ser más claro
            message = String(messages[0]);
          } else {
            message = String(messages);
          }

          // Limpiar el mensaje removiendo prefijos innecesarios
          message = message.replace(/^Validation failed: /, '');

          // Si aún tiene múltiples mensajes separados por coma, tomar solo el primero
          if (message.includes(', ')) {
            message = message.split(', ')[0];
          }

          // Si el mensaje empieza con el nombre del campo, mantener solo la descripción más clara
          message = message.replace(/^days /, 'The days parameter ');

          errorResponse = {
            error: 'InvalidParameters',
            message: message,
          };
        } else {
          errorResponse = {
            error: 'InvalidParameters',
            message: 'Invalid parameters provided',
          };
        }
      } else {
        // Para otros errores
        errorResponse = {
          error: 'InternalServerError',
          message: 'Internal server error',
        };
      }
    }

    response.status(status).json(errorResponse);
  }
}
