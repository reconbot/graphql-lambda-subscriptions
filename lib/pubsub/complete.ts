import AggregateError from 'aggregate-error'
import { parse } from 'graphql'
import { CompleteMessage, MessageType } from 'graphql-ws'
import { buildExecutionContext } from 'graphql/execution/execute'
import { ServerClosure, PubSubEvent, SubscribePseudoIterable, SubscriptionServer } from '../types'
import { postToConnection } from '../utils/postToConnection'
import { buildContext } from '../utils/buildContext'
import { getResolverAndArgs } from '../utils/getResolverAndArgs'
import { isArray } from '../utils/isArray'
import { getFilteredSubs } from './getFilteredSubs'

export const complete = (serverPromise: Promise<ServerClosure> | ServerClosure): SubscriptionServer['complete'] => async (event, excludeKeys) => {
  const server = await serverPromise
  const subscriptions = await getFilteredSubs({ server, event, excludeKeys })
  server.log('pubsub:complete', { event, subscriptions })

  const iters = subscriptions.map(async (sub) => {
    const message: CompleteMessage = {
      id: sub.subscriptionId,
      type: MessageType.Complete,
    }
    await postToConnection(server)({
      ...sub.requestContext,
      message,
    })
    await server.models.subscription.delete({ id: sub.id })

    const execContext = buildExecutionContext({
      schema: server.schema,
      document: parse(sub.subscription.query),
      contextValue: await buildContext({ server, connectionInitPayload: sub.connectionInitPayload, connectionId: sub.connectionId }),
      variableValues: sub.subscription.variables,
      operationName: sub.subscription.operationName,
    })

    if (isArray(execContext)) {
      throw new AggregateError(execContext)
    }

    const { field, root, args, context, info } = getResolverAndArgs({ execContext })

    const onComplete = (field?.subscribe as SubscribePseudoIterable<PubSubEvent>)?.onComplete
    server.log('pubsub:complete:onComplete', { onComplete: !!onComplete })
    await onComplete?.(root, args, context, info)
  })
  await Promise.all(iters)
}
