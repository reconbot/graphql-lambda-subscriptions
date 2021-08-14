import AggregateError from 'aggregate-error'
import { parse } from 'graphql'
import { CompleteMessage } from 'graphql-ws'
import { buildExecutionContext } from 'graphql/execution/execute'
import { SubscribePsuedoIterable, MessageHandler } from '../types'
import { deleteConnection } from '../utils/aws'
import { constructContext, getResolverAndArgs } from '../utils/graphql'
import { isArray } from '../utils/isArray'

/** Handler function for 'complete' message. */
export const complete: MessageHandler<CompleteMessage> =
  async ({ server, event, message }) => {
    try {
      const topicSubscriptions = server.mapper.query(server.model.Subscription, {
        id: `${event.requestContext.connectionId!}|${message.id}`,
      })
      let deletions = [] as Promise<any>[]
      for await (const entity of topicSubscriptions) {
        deletions = [
          ...deletions,
          (async () => {
            // only call onComplete per subscription
            if (deletions.length === 0) {
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
        ]
      }

      await Promise.all(deletions)
    } catch (err) {
      await server.onError?.(err, { event, message })
      await deleteConnection(server)(event.requestContext)
    }
  }
