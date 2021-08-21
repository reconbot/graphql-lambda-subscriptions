import { MessageType } from 'graphql-ws'
import { ServerClosure, ServerInstance } from './types'
import { postToConnection } from './utils/postToConnection'
import { deleteConnection } from './utils/deleteConnection'

export const handleStateMachineEvent = (serverPromise: Promise<ServerClosure>): ServerInstance['stateMachineHandler'] => async (input) => {
  const server = await serverPromise
  if (!server.pingpong) {
    throw new Error('Invalid pingpong settings')
  }
  const connection = Object.assign(new server.model.Connection(), {
    id: input.connectionId,
  })

  // Initial state - send ping message
  if (input.state === 'PING') {
    await postToConnection(server)({ ...input, message: { type: MessageType.Ping } })
    await server.mapper.update(Object.assign(connection, { hasPonged: false }), {
      onMissing: 'skip',
    })
    return {
      ...input,
      state: 'REVIEW',
      seconds: server.pingpong.delay,
    }
  }

  // Follow up state - check if pong was returned
  const conn = await server.mapper.get(connection)
  if (conn.hasPonged) {
    return {
      ...input,
      state: 'PING',
      seconds: server.pingpong.timeout,
    }
  }

  await deleteConnection(server)({ ...input })
  return {
    ...input,
    state: 'ABORT',
  }
}
