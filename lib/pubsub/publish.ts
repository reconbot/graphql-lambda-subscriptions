import { parse, execute } from 'graphql'
import { MessageType, NextMessage } from 'graphql-ws'
import { PubSubEvent, ServerClosure } from '../types'
import { sendMessage } from '../utils/aws'
import { constructContext } from '../utils/graphql'
import { getFilteredSubs } from './getFilteredSubs'

export const publish = (c: ServerClosure) => async (event: PubSubEvent): Promise<void> => {
  const subscriptions = await getFilteredSubs(c)(event)
  const iters = subscriptions.map(async (sub) => {
    const payload = await execute(
      c.schema,
      parse(sub.subscription.query),
      event,
      await constructContext(c)(sub),
      sub.subscription.variables,
      sub.subscription.operationName,
      undefined,
    )

    const message: NextMessage = {
      id: sub.subscriptionId,
      type: MessageType.Next,
      payload,
    }

    await sendMessage(c)({
      ...sub.requestContext,
      message,
    })
  })
  await Promise.all(iters)
}
