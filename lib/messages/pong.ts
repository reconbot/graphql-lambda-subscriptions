import { PongMessage } from 'graphql-ws'
import { deleteConnection } from '../utils/aws'
import { MessageHandler } from './types'

/** Handler function for 'pong' message. */
export const pong: MessageHandler<PongMessage> =
  async ({ c, event, message }) => {
    try {
      await c.onPong?.({ event, message })
      await c.mapper.update(
        Object.assign(new c.model.Connection(), {
          id: event.requestContext.connectionId!,
          hasPonged: true,
        }),
        {
          onMissing: 'skip',
        },
      )
    } catch (err) {
      await c.onError?.(err, { event, message })
      await deleteConnection(c)(event.requestContext)
    }
  }
