import { GRAPHQL_TRANSPORT_WS_PROTOCOL, MessageType } from 'graphql-ws'
import { ServerClosure, SubscriptionServer } from './types'
import { disconnect } from './messages/disconnect'
import { ping } from './messages/ping'
import { complete } from './messages/complete'
import { subscribe } from './messages/subscribe'
import { connection_init } from './messages/connection_init'
import { pong } from './messages/pong'

export const handleWebSocketEvent = (serverPromise: Promise<ServerClosure>): SubscriptionServer['webSocketHandler'] => async (event) => {
  const server = await serverPromise
  if (!event.requestContext) {
    server.log('handleWebSocketEvent unknown', { event })
    return {
      statusCode: 200,
      body: '',
    }
  }

  if (event.requestContext.eventType === 'CONNECT') {
    server.log('handleWebSocketEvent CONNECT', { connectionId: event.requestContext.connectionId })
    await server.onConnect?.({ event })
    return {
      statusCode: 200,
      headers: {
        'Sec-WebSocket-Protocol': GRAPHQL_TRANSPORT_WS_PROTOCOL,
      },
      body: '',
    }
  }

  if (event.requestContext.eventType === 'MESSAGE') {
    const message = event.body === null ? null : JSON.parse(event.body)
    server.log('handleWebSocketEvent MESSAGE', { connectionId: event.requestContext.connectionId, type: message.type })

    if (message.type === MessageType.ConnectionInit) {
      await connection_init({ server, event, message })
      return {
        statusCode: 200,
        body: '',
      }
    }

    if (message.type === MessageType.Subscribe) {
      await subscribe({ server, event, message })
      return {
        statusCode: 200,
        body: '',
      }
    }

    if (message.type === MessageType.Complete) {
      await complete({ server, event, message })
      return {
        statusCode: 200,
        body: '',
      }
    }

    if (message.type === MessageType.Ping) {
      await ping({ server, event, message })
      return {
        statusCode: 200,
        body: '',
      }
    }

    if (message.type === MessageType.Pong) {
      await pong({ server, event, message })
      return {
        statusCode: 200,
        body: '',
      }
    }
  }

  if (event.requestContext.eventType === 'DISCONNECT') {
    server.log('handleWebSocketEvent DISCONNECT', { connectionId: event.requestContext.connectionId })
    await disconnect({ server, event, message: null })
    return {
      statusCode: 200,
      body: '',
    }
  }

  server.log('handleWebSocketEvent UNKNOWN', { connectionId: event.requestContext.connectionId })
  return {
    statusCode: 200,
    body: '',
  }
}
