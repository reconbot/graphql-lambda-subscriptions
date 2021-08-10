import { DataMapper } from '@aws/dynamodb-data-mapper'
import { ServerArgs } from './types'
import { publish } from './pubsub/publish'
import { complete } from './pubsub/complete'
import { createModel } from './model/createModel'
import { Subscription } from './model/Subscription'
import { handleGatewayEvent } from './gateway'
import { handleStateMachineEvent } from './stepFunctionHandler'
import { Connection } from './model/Connection'

export const createInstance = (opts: ServerArgs) => {
  const closure = {
    ...opts,
    model: {
      Subscription: createModel({
        model: Subscription,
        table:
          opts.tableNames?.subscriptions || 'subscriptionless_subscriptions',
      }),
      Connection: createModel({
        model: Connection,
        table: opts.tableNames?.connections || 'subscriptionless_connections',
      }),
    },
    mapper: new DataMapper({ client: opts.dynamodb }),
  } as const

  return {
    gatewayHandler: handleGatewayEvent(closure),
    stateMachineHandler: handleStateMachineEvent(closure),
    publish: publish(closure),
    complete: complete(closure),
  }
}

export { prepareResolvers } from './utils/graphql'
export * from './pubsub/subscribe'

export * from './types'
export { Subscription } from './model/Subscription'
export { Connection } from './model/Connection'
