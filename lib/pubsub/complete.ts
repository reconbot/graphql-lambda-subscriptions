import { CompleteMessage, MessageType } from 'graphql-ws'
import { ServerClosure, PubSubEvent } from '../types'
import { sendMessage } from '../utils/aws'
import { getFilteredSubs } from './getFilteredSubs'

export const complete = (c: ServerClosure) => async (event: PubSubEvent): Promise<void> => {
  const subscriptions = await getFilteredSubs(c)(event)
  const iters = subscriptions.map(async (sub) => {
    const message: CompleteMessage = {
      id: sub.subscriptionId,
      type: MessageType.Complete,
    }
    await sendMessage(c)({
      ...sub.requestContext,
      message,
    })
    await c.mapper.delete(sub)
  })
  await Promise.all(iters)
}
