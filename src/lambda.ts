/* Lambda bootstrap for NestJS via serverless-express */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, HttpStatus, HttpException } from '@nestjs/common';
import { BusinessDayErrorCode } from './constants';
import serverlessExpress from '@vendia/serverless-express';
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

type InternalServer = ReturnType<typeof serverlessExpress>;
let cachedServer: InternalServer | undefined;

async function bootstrapServer(): Promise<InternalServer> {
  if (cachedServer) return cachedServer;

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
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
    }),
  );

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  cachedServer = serverlessExpress({ app: expressApp });
  return cachedServer;
}

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const server = await bootstrapServer();
  return await new Promise<APIGatewayProxyResult>((resolve, reject) => {
    // serverlessExpress handler invocation
    // Wrap in void to avoid no-floating-promises false positive inside callback chain
    void server(event, context, (err, result) => {
      if (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
        return;
      }
      if (result) {
        resolve(result as APIGatewayProxyResult);
      } else {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Empty response' }),
        });
      }
    });
  });
};
