import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpStatus, HttpException } from '@nestjs/common';
import { BusinessDayErrorCode } from './constants';
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

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
