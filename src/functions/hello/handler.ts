import 'source-map-support/register';

import 'reflect-metadata';
import * as DE from '@shiftcoders/dynamo-easy';
import * as AWS from 'aws-sdk';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class AutoBatchWrite extends DE.BatchWriteRequest {
  // Ref: https://github.com/shiftcode/dynamo-easy/issues/342

  protected itemCount = 0;

  putMixed(models: unknown[]) {
    if (
      this.itemCount + models.length >
      DE.BATCH_WRITE_MAX_REQUEST_ITEM_COUNT
    ) {
      throw new Error(
        `batch write takes at max ${DE.BATCH_WRITE_MAX_REQUEST_ITEM_COUNT} items`
      );
    }

    for (const model of models) {
      const meta = Reflect.getMetadata('sc-reflect:model', model.constructor);
      const item = { PutRequest: { Item: DE.toDb(model) } };
      const tableName = meta.tableName;
      this.params.RequestItems[tableName] =
        this.params.RequestItems[tableName] || [];
      this.params.RequestItems[tableName].push(item);
    }

    this.itemCount += models.length;

    return this;
  }
}

const ddb = new AWS.DynamoDB({ endpoint: 'http://localhost:8000' });

@DE.Model({ tableName: 'test-a' })
class ModelA {
  @DE.PartitionKey()
  public id: string;

  @DE.Property()
  public name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

@DE.Model({ tableName: 'test-b' })
class ModelB {
  @DE.PartitionKey()
  public id: string;

  @DE.Property()
  public value: number;

  constructor(id: string, value: number) {
    this.id = id;
    this.value = value;
  }
}

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async () => {
  const models = [];

  for (let i = 0; i < 200; ++i) {
    if (Math.random() < 0.5) {
      const k = Math.random().toString(16);
      const name = `name-${k}`;
      models.push(new ModelA(k, name));
    } else {
      const k = Math.random().toString(16);
      const value = Math.random() * 1000;
      models.push(new ModelB(k, value));
    }
  }

  const resp: Promise<AWS.DynamoDB.BatchWriteItemOutput>[] = [];

  while (models.length > 0) {
    const slc = models.splice(0, 25);
    resp.push(new AutoBatchWrite(ddb).putMixed(slc).execFullResponse());
  }

  const res = await Promise.all(resp);

  return formatJSONResponse({
    models,
    res,
  });
};

export const main = middyfy(hello);
