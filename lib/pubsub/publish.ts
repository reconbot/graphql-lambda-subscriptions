import { parse, execute } from 'graphql'
import { MessageType, NextMessage } from 'graphql-ws'
import { ServerClosure, SubscriptionServer } from '../types'
import { postToConnection } from '../utils/postToConnection'
import { buildContext } from '../utils/buildContext'
import { getFilteredSubs } from './getFilteredSubs'

export const publish = (serverPromise: Promise<ServerClosure> | ServerClosure): SubscriptionServer['publish'] => async (event, excludeKeys) => {
  const server = await serverPromise
  server.log('pubsub:publish', { event, excludeKeys })
  const subscriptions = await getFilteredSubs({ server, event, excludeKeys })
  server.log('pubsub:publish', { subscriptions: subscriptions.map(({ connectionId, filter, subscription }) => ({ connectionId, filter, subscription }) ) })

  const iters = subscriptions.map(async (sub) => {
    const payload = await execute({
      schema: server.schema,
      document: parse(sub.subscription.query),
      rootValue: event,
      contextValue: await buildContext({ server, connectionInitPayload: sub.connectionInitPayload, connectionId: sub.connectionId }),
      variableValues: sub.subscription.variables,
      operationName: sub.subscription.operationName,
    })

    const message: NextMessage = {
      id: sub.subscriptionId,
      type: MessageType.Next,
      payload,
    }

    await postToConnection(server)({
      ...sub.requestContext,
      message,
    })
  })
  await Promise.all(iters)
}
