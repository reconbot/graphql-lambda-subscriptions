import { ServerArgs, ServerClosure, Connection, Subscription } from './types'
import { DDB } from './ddb/DDB'
import { log as debugLogger } from './utils/logger'

export const makeServerClosure = async (opts: ServerArgs): Promise<ServerClosure> => {
  const {
    tableNames,
    log = debugLogger,
    dynamodb: dynamodbPromise,
    apiGatewayManagementApi,
    pingpong,
    ...rest
  } = opts
  const dynamodb = await dynamodbPromise
  return {
    ...rest,
    apiGatewayManagementApi: await apiGatewayManagementApi,
    pingpong: await pingpong,
    dynamodb: dynamodb,
    log,
    models: {
      subscription: DDB<Subscription>({ dynamodb, tableName:  (await tableNames)?.subscriptions || 'graphql_subscriptions', log }),
      connection: DDB<Connection>({ dynamodb, tableName:  (await tableNames)?.connections || 'graphql_connections', log }),
    },
  }
}
