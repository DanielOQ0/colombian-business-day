import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { BusinessDayErrorCode } from '../src/constants';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { INestApplication } from '@nestjs/common';

let app: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (!app) {
    app = await NestFactory.create(AppModule);

    // Configurar validación global
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors) => {
          const messages = errors
            .map((error) => Object.values(error.constraints || {}).join(', '))
            .join('; ');
          return new HttpException(
            {
              error: BusinessDayErrorCode.INVALID_PARAMETERS,
              message: `Validation failed: ${messages}`,
            },
            HttpStatus.BAD_REQUEST,
          );
        },
      }),
    );

    // Habilitar CORS
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await app.init();
  }
  return app;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const nestApp = await bootstrap();
  const httpAdapter = nestApp.getHttpAdapter();

  // Usar el método getHttpServer() que es más seguro
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const server = httpAdapter.getHttpServer();

  // Procesar la request
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  server.emit('request', req, res);
}
