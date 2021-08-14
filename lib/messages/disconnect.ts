import AggregateError from 'aggregate-error'
import { parse } from 'graphql'
import { equals } from '@aws/dynamodb-expressions'
import { buildExecutionContext } from 'graphql/execution/execute'
import { constructContext, getResolverAndArgs } from '../utils/graphql'
import { SubscribePsuedoIterable, MessageHandler } from '../types'
import { isArray } from '../utils/isArray'

/** Handler function for 'disconnect' message. */
export const disconnect: MessageHandler<null> =
  async ({ server, event }) => {
    try {
      await server.onDisconnect?.({ event })

      const entities = server.mapper.query(
        server.model.Subscription,
        {
          connectionId: equals(event.requestContext.connectionId),
        },
        { indexName: 'ConnectionIndex' },
      )

      const completed = {} as Record<string, boolean>
      const deletions = [] as Promise<any>[]
      for await (const entity of entities) {
        deletions.push(
          (async () => {
            // only call onComplete per subscription
            if (!completed[entity.subscriptionId]) {
              completed[entity.subscriptionId] = true

              const execContext = buildExecutionContext(
                server.schema,
                parse(entity.subscription.query),
                undefined,
                await constructContext(server)(entity),
                entity.subscription.variables,
                entity.subscription.operationName,
                undefined,
              )

              if (isArray(execContext)) {
                throw new AggregateError(execContext)
              }


              const [field, root, args, context, info] = getResolverAndArgs(server)(execContext)

              const onComplete = (field?.subscribe as SubscribePsuedoIterable)?.onComplete
              if (onComplete) {
                await onComplete(root, args, context, info)
              }
            }

            await server.mapper.delete(entity)
          })(),
        )
      }

      await Promise.all([
        // Delete subscriptions
        ...deletions,
        // Delete connection
        server.mapper.delete(
          Object.assign(new server.model.Connection(), {
            id: event.requestContext.connectionId!,
          }),
        ),
      ])
    } catch (err) {
      await server.onError?.(err, { event })
    }
  }
