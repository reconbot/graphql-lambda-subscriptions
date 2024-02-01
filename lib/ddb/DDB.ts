import { AttributeAction, DynamoDBClient, PutItemCommandInput, QueryCommandInput } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb'
import { LoggerFunction, DDBType } from '../types'

export interface DDBClient<T extends DDBType, TKey extends Record<string, NativeAttributeValue> | undefined> {
  get: (Key: TKey) => Promise<T | null>
  put: (obj: T, putOptions?: Partial<PutItemCommandInput>) => Promise<T>
  update: (Key: TKey, obj: Partial<T>) => Promise<T>
  delete: (Key: TKey) => Promise<T>
  query: (options: Omit<QueryCommandInput, 'TableName' | 'Select'>) => AsyncGenerator<T, void, undefined>
}

export const DDB = <T extends DDBType, TKey extends Record<string, NativeAttributeValue> | undefined>({
  dynamodb,
  tableName,
  log,
}: {
  dynamodb: DynamoDBClient
  tableName: string
  log: LoggerFunction
}): DDBClient<T, TKey> => {
  const documentClient = DynamoDBDocument.from( dynamodb )

  const get = async (Key: TKey): Promise<null | T> => {
    log('get', { tableName: tableName, Key })
    try {
      const { Item } = await documentClient.get({
        TableName: tableName,
        Key,
      })
      log('get:result', { Item })
      return (Item as T) ?? null
    } catch (e) {
      log('get:error', e)
      throw e
    }
  }

  const put = async (Item: T, putOptions?: Partial<PutItemCommandInput>): Promise<T> => {
    log('put', { tableName: tableName, Item })
    try {
      const { Attributes } = await documentClient.put({
        TableName: tableName,
        Item,
        ReturnValues: 'ALL_OLD',
        ...putOptions,
      })
      return Attributes as T
    } catch (e) {
      log('put:error', e)
      throw e
    }
  }

  const update = async (Key: TKey, obj: Partial<T>) => {
    log('update', { tableName: tableName, Key, obj })
    try {
      const AttributeUpdates = Object.entries(obj)
        .map(([key, Value]) => ({ [key]: { Value, Action: AttributeAction.PUT } }))
        .reduce((memo, val) => ({ ...memo, ...val }))

      const { Attributes } = await documentClient.update({
        TableName: tableName,
        Key,
        AttributeUpdates,
        ReturnValues: 'ALL_NEW',
      })
      return Attributes as T
    } catch (e) {
      log('update:error', e)
      throw e
    }
  }

  const deleteFunction = async (Key: TKey): Promise<T> => {
    log('delete', { tableName: tableName, Key })
    try {
      const { Attributes } = await documentClient.delete({
        TableName: tableName,
        Key,
        ReturnValues: 'ALL_OLD',
      })
      return Attributes as T
    } catch (e) {
      log('delete:error', e)
      throw e
    }
  }

  const queryOnce = async (options: Omit<QueryCommandInput, 'TableName' | 'Select'>) => {
    log('queryOnce', { tableName: tableName, options })
    try {
      const response = await documentClient.query({
        TableName: tableName,
        Select: 'ALL_ATTRIBUTES',
        ...options,
      })

      const { Items, LastEvaluatedKey, Count } = response
      return {
        items: (Items ?? []) as T[],
        lastEvaluatedKey: LastEvaluatedKey,
        count: Count ?? 0,
      }
    } catch (e) {
      log('queryOnce:error', e)
      throw e
    }
  }

  async function* query(options: Omit<QueryCommandInput, 'TableName' | 'Select'>) {
    log('query', { tableName: tableName, options })
    try {
      const results = await queryOnce(options)
      yield* results.items
      let lastEvaluatedKey = results.lastEvaluatedKey
      while (lastEvaluatedKey) {
        const results = await queryOnce({ ...options, ExclusiveStartKey: lastEvaluatedKey })
        yield* results.items
        lastEvaluatedKey = results.lastEvaluatedKey
      }
    } catch (e) {
      log('query:error', e)
      throw e
    }
  }

  return {
    get,
    put,
    update,
    query,
    delete: deleteFunction,
  }
}
