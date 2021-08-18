import AggregateError from 'aggregate-error'
import { parse } from 'graphql'
import { equals } from '@aws/dynamodb-expressions'
import { buildExecutionContext } from 'graphql/execution/execute'
import { constructContext } from '../utils/constructContext'
import { getResolverAndArgs } from '../utils/getResolverAndArgs'
import { SubscribePseudoIterable, MessageHandler, PubSubEvent } from '../types'
import { isArray } from '../utils/isArray'
import { collect } from 'streaming-iterables'
import { Connection } from '../model/Connection'

/** Handler function for 'disconnect' message. */
export const disconnect: MessageHandler<null> =
  async ({ server, event }) => {
    try {
      await server.onDisconnect?.({ event })

      const topicSubscriptions = await collect(server.mapper.query(
        server.model.Subscription,
        {
          connectionId: equals(event.requestContext.connectionId),
        },
        { indexName: 'ConnectionIndex' },
      ))

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
            }

            await server.mapper.delete(sub)
          })(),
        )
      }

      await Promise.all([
        // Delete subscriptions
        ...deletions,
        // Delete connection
        server.mapper.delete(
          Object.assign(new server.model.Connection(), {
            id: event.requestContext.connectionId,
          }),
        ),
      ])
    } catch (err) {
      await server.onError?.(err, { event })
    }
  }
