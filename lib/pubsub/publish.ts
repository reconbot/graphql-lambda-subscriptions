import { parse, execute } from 'graphql'
import { MessageType, NextMessage } from 'graphql-ws'
import { ServerClosure, SubscriptionServer } from '../types'
import { postToConnection } from '../utils/postToConnection'
import { buildContext } from '../utils/buildContext'
import { getFilteredSubs } from './getFilteredSubs'

export const publish = (serverPromise: Promise<ServerClosure> | ServerClosure): SubscriptionServer['publish'] => async event => {
  const server = await serverPromise
  server.log('pubsub:publish', { event })
  const subscriptions = await getFilteredSubs({ server, event })
  server.log('pubsub:publish', { subscriptions: subscriptions.map(({ connectionId, filter, subscription }) => ({ connectionId, filter, subscription }) ) })

  const iters = subscriptions.map(async (sub) => {
    const payload = await execute(
      server.schema,
      parse(sub.subscription.query),
      event,
      await buildContext({ server, connectionInitPayload: sub.connectionInitPayload, connectionId: sub.connectionId }),
      sub.subscription.variables,
      sub.subscription.operationName,
      undefined,
    )

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
