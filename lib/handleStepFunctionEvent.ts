import { MessageType } from 'graphql-ws'
import { ServerClosure, SubscriptionServer } from './types'
import { postToConnection } from './utils/postToConnection'
import { deleteConnection } from './utils/deleteConnection'

export const handleStepFunctionEvent = (serverPromise: Promise<ServerClosure>): SubscriptionServer['stepFunctionsHandler'] => async (input) => {
  const server = await serverPromise
  if (!server.pingpong) {
    throw new Error('Invalid pingpong settings')
  }

  // Initial state - send ping message
  if (input.state === 'PING') {
    await postToConnection(server)({ ...input, message: { type: MessageType.Ping } })
    await server.models.connection.update(input.connectionId, { hasPonged: false })
    return {
      ...input,
      state: 'REVIEW',
      seconds: server.pingpong.delay,
    }
  }

  // Follow up state - check if pong was returned
  const conn = await server.models.connection.get(input.connectionId)
  if (conn?.hasPonged) {
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
