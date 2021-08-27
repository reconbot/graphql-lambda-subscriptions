import { DynamoDB } from 'aws-sdk'
import { LoggerFunction, DDBType } from '../types'

export interface DDBClient<T extends DDBType> {
  get: (id: string) => Promise<T|null>
  put: (Item: T) => Promise<T>
  update: (id: string, obj: Partial<T>) => Promise<T>
  delete: (id: string) => Promise<T>
  query: (options: Omit<DynamoDB.DocumentClient.QueryInput, 'TableName' | 'Select'>) => AsyncGenerator<T, void, undefined>
}

export const DDB = <T extends DDBType>({
  dynamodb,
  tableName,
  log,
}: {
  dynamodb: DynamoDB
  tableName: string
  log: LoggerFunction
}): DDBClient<T> => {
  const documentClient = new DynamoDB.DocumentClient({ service: dynamodb })

  const get = async (id: string): Promise<null | T> => {
    log('get', { tableName: tableName, id })
    const { Item } = await documentClient.get({
      TableName: tableName,
      Key: { id },
    }).promise()
    return (Item as T) ?? null
  }

  const put = async (Item: T): Promise<T> => {
    log('put', { tableName: tableName, Item })
    const { Attributes } = await documentClient.put({
      TableName: tableName,
      Item,
      ReturnValues: 'ALL_OLD',
    }).promise()
    return Attributes as T
  }

  const update = async (id: string, obj: Partial<T>) => {
    const AttributeUpdates = Object.entries(obj)
      .map(([key, Value]) => ({ [key]: { Value, Action: 'PUT' } }))
      .reduce((memo, val) => ({ ...memo, ...val }))

    const { Attributes } = await documentClient.update({
      TableName: tableName,
      Key: { id },
      AttributeUpdates,
      ReturnValues: 'ALL_NEW',
    }).promise()
    return Attributes as T
  }

  const deleteFunction = async (id: string): Promise<T> => {
    const { Attributes } = await documentClient.delete({
      TableName: tableName,
      Key: { id },
      ReturnValues: 'ALL_OLD',
    }).promise()
    return Attributes as T
  }

  const queryOnce = async (options: Omit<DynamoDB.DocumentClient.QueryInput, 'TableName' | 'Select'>) => {
    log('queryOnce', options)

    const response = await documentClient.query({
      TableName: tableName,
      Select: 'ALL_ATTRIBUTES',
      ...options,
    }).promise()

    const { Items, LastEvaluatedKey, Count } = response
    return {
      items: (Items ?? []) as T[],
      lastEvaluatedKey: LastEvaluatedKey,
      count: Count ?? 0,
    }
  }

  async function* query(options: Omit<DynamoDB.DocumentClient.QueryInput, 'TableName' | 'Select'>) {
    log('query', options)
    const results = await queryOnce(options)
    yield* results.items
    let lastEvaluatedKey = results.lastEvaluatedKey
    while (lastEvaluatedKey) {
      const results = await queryOnce({ ...options, ExclusiveStartKey: lastEvaluatedKey })
      yield* results.items
      lastEvaluatedKey = results.lastEvaluatedKey
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
