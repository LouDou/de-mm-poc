import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';

const serverlessConfiguration: AWS = {
  service: 'de-mm-test',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
    dynamodb: {
      stages: ['local'],
      start: {
        inMemory: false,
        migrate: true,
        seed: true,
      },
    },
  },
  plugins: [
    'serverless-webpack',
    'serverless-offline',
    'serverless-dynamodb-local',
  ],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
    lambdaHashingVersion: '20201221',
  },
  // import the function via paths
  functions: { hello },

  resources: {
    Resources: {
      DDBTableA: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'test-a',
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'name', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
            { AttributeName: 'name', KeyType: 'RANGE' },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      },

      DDBTableB: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'test-b',
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'value', AttributeType: 'N' },
          ],
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
            { AttributeName: 'value', KeyType: 'RANGE' },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
