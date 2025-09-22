import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
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
