import { PongMessage } from 'graphql-ws'
import { deleteConnection } from '../utils/deleteConnection'
import { MessageHandler } from '../types'

/** Handler function for 'pong' message. */
export const pong: MessageHandler<PongMessage> =
  async ({ server, event, message }) => {
    try {
      await server.onPong?.({ event, message })
      await server.models.connection.update(event.requestContext.connectionId, {
        hasPonged: true,
      })
    } catch (err) {
      await server.onError?.(err, { event, message })
      await deleteConnection(server)(event.requestContext)
    }
  }
