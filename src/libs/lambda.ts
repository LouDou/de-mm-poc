import middy from '@middy/core';
import middyJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ValidatedEventAPIGatewayProxyEvent } from './apiGateway';

export const middyfy = (
  handler: ValidatedEventAPIGatewayProxyEvent<{
    readonly type: 'object';
    readonly properties: { readonly name: { readonly type: 'string' } };
    readonly required: readonly ['name'];
  }>
): middy.Middy<
  Omit<APIGatewayProxyEvent, 'body'> & {
    body: { [x: string]: unknown; name: string };
  },
  APIGatewayProxyResult
> => {
  return middy(handler).use(middyJsonBodyParser());
};
