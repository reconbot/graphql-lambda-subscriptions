import AggregateError from 'aggregate-error'
import { parse } from 'graphql'
import { buildExecutionContext } from 'graphql/execution/execute'
import { buildContext } from '../utils/buildContext'
import { getResolverAndArgs } from '../utils/getResolverAndArgs'
import { SubscribePseudoIterable, MessageHandler, PubSubEvent } from '../types'
import { isArray } from '../utils/isArray'
import { collect } from 'streaming-iterables'
import { Connection } from '../types'

/** Handler function for 'disconnect' message. */
export const disconnect: MessageHandler<null> = async ({ server, event }) => {
  server.log('messages:disconnect', { connectionId: event.requestContext.connectionId })
  try {
    await server.onDisconnect?.({ event })

    const topicSubscriptions = await collect(server.models.subscription.query({
      IndexName: 'ConnectionIndex',
      ExpressionAttributeNames: { '#a': 'connectionId' },
      ExpressionAttributeValues: { ':1': event.requestContext.connectionId },
      KeyConditionExpression: '#a = :1',
    }))

    const completed = {} as Record<string, boolean>
    const deletions = [] as Promise<void|Connection>[]
    for (const sub of topicSubscriptions) {
      deletions.push(
        (async () => {
          // only call onComplete per subscription
          if (!completed[sub.subscriptionId]) {
            completed[sub.subscriptionId] = true

            const execContext = buildExecutionContext(
              server.schema,
              parse(sub.subscription.query),
              undefined,
              await buildContext({ server, connectionInitPayload: sub.connectionInitPayload, connectionId: sub.connectionId }),
              sub.subscription.variables,
              sub.subscription.operationName,
              undefined,
            )

            if (isArray(execContext)) {
              throw new AggregateError(execContext)
            }


            const [field, root, args, context, info] = getResolverAndArgs(server)(execContext)

            const onComplete = (field?.subscribe as SubscribePseudoIterable<PubSubEvent>)?.onComplete
            server.log('messages:disconnect:onComplete', { onComplete: !!onComplete })
            await onComplete?.(root, args, context, info)
          }

          await server.models.subscription.delete(sub.id)
        })(),
      )
    }

    await Promise.all([
      // Delete subscriptions
      ...deletions,
      // Delete connection
      server.models.connection.delete(event.requestContext.connectionId),
    ])
  } catch (err) {
    server.log('messages:disconnect:onError', { err, event })
    await server.onError?.(err, { event })
  }
}
