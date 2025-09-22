import { NestFactory } from '@nestjs/core';
import { createValidationPipe } from './config/validation';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar validación global
  app.useGlobalPipes(createValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
