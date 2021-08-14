import AggregateError from 'aggregate-error'
import { parse } from 'graphql'
import { CompleteMessage, MessageType } from 'graphql-ws'
import { buildExecutionContext } from 'graphql/execution/execute'
import { ServerClosure, PubSubEvent, SubscribePsuedoIterable } from '../types'
import { sendMessage } from '../utils/aws'
import { constructContext, getResolverAndArgs } from '../utils/graphql'
import { isArray } from '../utils/isArray'
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

    const execContext = buildExecutionContext(
      c.schema,
      parse(sub.subscription.query),
      undefined,
      await constructContext(c)(sub),
      sub.subscription.variables,
      sub.subscription.operationName,
      undefined,
    )

    if (isArray(execContext)) {
      throw new AggregateError(execContext)
    }

    const [field, root, args, context, info] = getResolverAndArgs(c)(execContext)

    const onComplete = (field?.subscribe as SubscribePsuedoIterable)?.onComplete
    if (onComplete) {
      await onComplete(root, args, context, info)
    }

  })
  await Promise.all(iters)
}
