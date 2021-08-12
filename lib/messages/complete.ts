import { parse } from 'graphql'
import { CompleteMessage } from 'graphql-ws'
import { buildExecutionContext } from 'graphql/execution/execute'
import { SubscribePsuedoIterable } from '../types'
import { deleteConnection } from '../utils/aws'
import { constructContext, getResolverAndArgs } from '../utils/graphql'
import { MessageHandler } from './types'

/** Handler function for 'complete' message. */
export const complete: MessageHandler<CompleteMessage> =
  async ({ c, event, message }) => {
    try {
      const topicSubscriptions = await c.mapper.query(c.model.Subscription, {
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
                c.schema,
                parse(entity.subscription.query),
                undefined,
                await constructContext(c)(entity),
                entity.subscription.variables,
                entity.subscription.operationName,
                undefined,
              )

              if (!('operation' in execContext)) {
                throw execContext
              }

              const [field, root, args, context, info] = getResolverAndArgs(c)(execContext)

              const onComplete = (field?.subscribe as SubscribePsuedoIterable)?.onComplete
              if (onComplete) {
                await onComplete(root, args, context, info)
              }
            }

            await c.mapper.delete(entity)
          })(),
        ]
      }

      await Promise.all(deletions)
    } catch (err) {
      await c.onError?.(err, { event, message })
      await deleteConnection(c)(event.requestContext)
    }
  }
