import { DataMapper } from '@aws/dynamodb-data-mapper'
import { ServerArgs, ServerClosure } from './types'
import { createModel } from './model/createModel'
import { Subscription } from './model/Subscription'
import { Connection } from './model/Connection'
import { log as debugLogger } from './utils/logger'

export const makeServerClosure = async (opts: ServerArgs): Promise<ServerClosure> => {
  const {
    tableNames,
    log = debugLogger,
    dynamodb,
    apiGatewayManagementApi,
    ...rest
  } = opts
  return {
    ...rest,
    apiGatewayManagementApi: await apiGatewayManagementApi,
    log,
    model: {
      Subscription: createModel({
        model: Subscription,
        table: (await tableNames)?.subscriptions || 'graphql_subscriptions',
      }),
      Connection: createModel({
        model: Connection,
        table: (await tableNames)?.connections || 'graphql_connections',
      }),
    },
    mapper: new DataMapper({ client: await dynamodb }),
  }
}
