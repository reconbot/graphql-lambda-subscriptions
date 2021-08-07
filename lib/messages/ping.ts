import { PingMessage, MessageType } from 'graphql-ws'
import { deleteConnection, sendMessage } from '../utils/aws'
import { MessageHandler } from './types'

/** Handler function for 'ping' message. */
export const ping: MessageHandler<PingMessage> =
  (c) =>
    async ({ event, message }) => {
      try {
        await c.onPing?.({ event, message })
        return sendMessage(c)({
          ...event.requestContext,
          message: { type: MessageType.Pong },
        })
      } catch (err) {
        await c.onError?.(err, { event, message })
        await deleteConnection(c)(event.requestContext)
      }
    }
