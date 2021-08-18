import { parse, execute } from 'graphql'
import { MessageType, NextMessage } from 'graphql-ws'
import { ServerClosure, ServerInstance } from '../types'
import { sendMessage } from '../utils/sendMessage'
import { constructContext } from '../utils/constructContext'
import { getFilteredSubs } from './getFilteredSubs'

export const publish = (server: ServerClosure): ServerInstance['publish'] => async event => {
  server.log('pubsub:publish %j', { event })
  const subscriptions = await getFilteredSubs({ server, event })
  server.log('pubsub:publish %j', { subscriptions: subscriptions.map(({ connectionId, filter, subscription }) => ({ connectionId, filter, subscription }) ) })

  const iters = subscriptions.map(async (sub) => {
    const payload = await execute(
      server.schema,
      parse(sub.subscription.query),
      event,
      await constructContext({ server, connectionParams: sub.connectionParams, connectionId: sub.connectionId }),
      sub.subscription.variables,
      sub.subscription.operationName,
      undefined,
    )

    const message: NextMessage = {
      id: sub.subscriptionId,
      type: MessageType.Next,
      payload,
    }

    await sendMessage(server)({
      ...sub.requestContext,
      message,
    })
  })
  await Promise.all(iters)
}
