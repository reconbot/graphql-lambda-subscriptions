import { MessageType } from 'graphql-ws'
import { ServerClosure, ServerInstance } from './types'
import { sendMessage } from './utils/sendMessage'
import { deleteConnection } from './utils/deleteConnection'

export const handleStateMachineEvent = (c: ServerClosure): ServerInstance['stateMachineHandler'] => async (input) => {
  if (!c.pingpong) {
    throw new Error('Invalid pingpong settings')
  }
  const connection = Object.assign(new c.model.Connection(), {
    id: input.connectionId,
  })

  // Initial state - send ping message
  if (input.state === 'PING') {
    await sendMessage(c)({ ...input, message: { type: MessageType.Ping } })
    await c.mapper.update(Object.assign(connection, { hasPonged: false }), {
      onMissing: 'skip',
    })
    return {
      ...input,
      state: 'REVIEW',
      seconds: c.pingpong.delay,
    }
  }

  // Follow up state - check if pong was returned
  const conn = await c.mapper.get(connection)
  if (conn.hasPonged) {
    return {
      ...input,
      state: 'PING',
      seconds: c.pingpong.timeout,
    }
  }

  await deleteConnection(c)({ ...input })
  return {
    ...input,
    state: 'ABORT',
  }
}
