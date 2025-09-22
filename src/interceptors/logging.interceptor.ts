import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LOG_MESSAGES } from '../constants/index';

interface ErrorWithStatus {
  status?: number;
  message?: string;
  stack?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method;
    const url = request.url;
    const query = request.query;
    const body: unknown = request.body;

    const startTime = Date.now();

    this.logger.log(LOG_MESSAGES.REQUEST_LOG(method, url, query, body));

    return next.handle().pipe(
      tap((data: unknown) => {
        const duration = Date.now() - startTime;
        this.logger.log(
          LOG_MESSAGES.RESPONSE_LOG(
            method,
            url,
            response.statusCode,
            duration,
            data,
          ),
        );
      }),
      catchError((error: ErrorWithStatus) => {
        const duration = Date.now() - startTime;
        const status = error.status || 500;
        const message = error.message || 'Unknown error';
        const stack = error.stack || 'No stack trace available';

        this.logger.error(
          LOG_MESSAGES.ERROR_LOG(method, url, status, duration, message),
          stack,
        );
        throw error as Error;
      }),
    );
  }
}
