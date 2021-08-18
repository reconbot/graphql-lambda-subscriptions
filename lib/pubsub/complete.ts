import AggregateError from 'aggregate-error'
import { parse } from 'graphql'
import { CompleteMessage, MessageType } from 'graphql-ws'
import { buildExecutionContext } from 'graphql/execution/execute'
import { ServerClosure, PubSubEvent, SubscribePseudoIterable, ServerInstance } from '../types'
import { sendMessage } from '../utils/sendMessage'
import { constructContext } from '../utils/constructContext'
import { getResolverAndArgs } from '../utils/getResolverAndArgs'
import { isArray } from '../utils/isArray'
import { getFilteredSubs } from './getFilteredSubs'

export const complete = (server: ServerClosure): ServerInstance['complete'] => async event => {
  const subscriptions = await getFilteredSubs({ server, event })
  server.log('pubsub:complete %j', { event, subscriptions })

  const iters = subscriptions.map(async (sub) => {
    const message: CompleteMessage = {
      id: sub.subscriptionId,
      type: MessageType.Complete,
    }
    await sendMessage(server)({
      ...sub.requestContext,
      message,
    })
    await server.mapper.delete(sub)

    const execContext = buildExecutionContext(
      server.schema,
      parse(sub.subscription.query),
      undefined,
      await constructContext({ server, connectionParams: sub.connectionParams, connectionId: sub.connectionId }),
      sub.subscription.variables,
      sub.subscription.operationName,
      undefined,
    )

    if (isArray(execContext)) {
      throw new AggregateError(execContext)
    }

    const [field, root, args, context, info] = getResolverAndArgs(server)(execContext)

    const onComplete = (field?.subscribe as SubscribePseudoIterable<PubSubEvent>)?.onComplete
    if (onComplete) {
      await onComplete(root, args, context, info)
    }

  })
  await Promise.all(iters)
}
