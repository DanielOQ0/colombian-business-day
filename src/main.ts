import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors
          .map((error) => Object.values(error.constraints || {}).join(', '))
          .join('; ');

        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'InvalidParameters',
          message: `Validation failed: ${messages}`,
        };
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
