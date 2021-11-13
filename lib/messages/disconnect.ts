import AggregateError from 'aggregate-error'
import { parse } from 'graphql'
import { buildExecutionContext } from 'graphql/execution/execute'
import { buildContext } from '../utils/buildContext'
import { getResolverAndArgs } from '../utils/getResolverAndArgs'
import { SubscribePseudoIterable, MessageHandler, PubSubEvent } from '../types'
import { isArray } from '../utils/isArray'
import { collect } from 'streaming-iterables'

/** Handler function for 'disconnect' message. */
export const disconnect: MessageHandler<null> = async ({ server, event }) => {
  const { connectionId } = event.requestContext
  server.log('messages:disconnect', { connectionId })
  try {
    await server.onDisconnect?.({ event })

    const topicSubscriptions = await collect(server.models.subscription.query({
      IndexName: 'ConnectionIndex',
      ExpressionAttributeNames: { '#a': 'connectionId' },
      ExpressionAttributeValues: { ':1': connectionId },
      KeyConditionExpression: '#a = :1',
    }))

    const deletions = topicSubscriptions.map(async (sub) => {
      const queryContext = await buildContext({ server, connectionInitPayload: sub.connectionInitPayload, connectionId })

      const execContext = buildExecutionContext({
        schema: server.schema,
        document: parse(sub.subscription.query),
        contextValue: queryContext,
        variableValues: sub.subscription.variables,
        operationName: sub.subscription.operationName,
      })

      if (isArray(execContext)) {
        throw new AggregateError(execContext)
      }

      const { field, root, args, context, info } = getResolverAndArgs({ execContext })

      const onComplete = (field?.subscribe as SubscribePseudoIterable<PubSubEvent>)?.onComplete
      server.log('messages:disconnect:onComplete', { onComplete: !!onComplete })
      await onComplete?.(root, args, context, info)
      await server.models.subscription.delete({ id: sub.id })
    })

    // do this first so that we don't create any more subscriptions for this connection
    await server.models.connection.delete({ id: connectionId })
    await Promise.all(deletions)
  } catch (err) {
    server.log('messages:disconnect:onError', { err, event })
    await server.onError?.(err, { event })
  }
}
