import { PingMessage, MessageType } from 'graphql-ws'
import { postToConnection } from '../utils/postToConnection'
import { deleteConnection } from '../utils/deleteConnection'
import { MessageHandler } from '../types'

/** Handler function for 'ping' message. */
export const ping: MessageHandler<PingMessage> = async ({ server, event, message }) => {
  try {
    await server.onPing?.({ event, message })
    return postToConnection(server)({
      ...event.requestContext,
      message: { type: MessageType.Pong },
    })
  } catch (err) {
    await server.onError?.(err, { event, message })
    await deleteConnection(server)(event.requestContext)
  }
}
