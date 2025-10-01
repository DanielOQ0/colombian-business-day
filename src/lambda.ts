/* Lambda bootstrap for NestJS via serverless-express */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createValidationPipe } from './config/validation';
import serverlessExpress from '@vendia/serverless-express';
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

type InternalServer = ReturnType<typeof serverlessExpress>;
let cachedServer: InternalServer | undefined;

async function bootstrapServer(): Promise<InternalServer> {
  if (cachedServer) return cachedServer;

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.useGlobalPipes(createValidationPipe());

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  cachedServer = serverlessExpress({ app: expressApp });
  return cachedServer;
}

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const server = await bootstrapServer();
  return await new Promise<APIGatewayProxyResult>((resolve, reject) => {
    // invocar el servidor express con el evento y contexto de Lambda
    // y manejar la respuesta en la devolución de llamada
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
