import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { RestApi, LambdaIntegration, EndpointType, Cors } from 'aws-cdk-lib/aws-apigateway';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export class ColombianBusinessDayStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Try to reference an existing SSM Parameter for the holidays API URL; if not present user must create it.
    // Name convention allows future environments (e.g., /colombian-business-day/prod/holidays-api-url)
    const holidaysApiParam = StringParameter.fromStringParameterName(
      this,
      'HolidaysApiUrlParam',
      '/colombian-business-day/prod/holidays-api-url',
    );

    const lambdaProps: NodejsFunctionProps = {
      entry: path.join(__dirname, '../../src/lambda.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.seconds(10),
      environment: {
        NODE_ENV: 'production',
        // Value pulled from SSM Parameter Store; create it before deploy if not exists
        HOLIDAYS_API_URL: holidaysApiParam.stringValue,
      },
      bundling: {
        target: 'node20',
        platform: 'node',
        // Output default (esm) works with Node 20; cjs literal not accepted by type
        minify: true,
        sourceMap: false,
        externalModules: ['@nestjs/microservices', 'cache-manager', 'class-validator', 'class-transformer'],
      },
    };

    const apiLambda = new NodejsFunction(this, 'BusinessDayLambda', lambdaProps);

    const api = new RestApi(this, 'BusinessDayApi', {
      restApiName: 'Colombian Business Day Service',
      description: 'API para validar días hábiles en Colombia',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
    });

    const lambdaIntegration = new LambdaIntegration(apiLambda);
    api.root.addProxy({
      anyMethod: true,
      defaultIntegration: lambdaIntegration,
    });

    new CfnOutput(this, 'BusinessDayApiEndpoint', {
      value: api.url ?? 'UNDEFINED',
      description: 'Base URL de la API (stage prod)',
    });

    new CfnOutput(this, 'HolidaysApiUrlSource', {
      value: holidaysApiParam.stringValue,
      description: 'Valor de HOLIDAYS_API_URL proveniente de SSM',
    });
  }
}
