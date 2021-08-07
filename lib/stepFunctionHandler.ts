import { MessageType } from 'graphql-ws'
import { ServerClosure, StateFunctionInput } from './types'
import { deleteConnection, sendMessage } from './utils/aws'

export const handleStateMachineEvent =
  (c: ServerClosure) =>
    async (input: StateFunctionInput): Promise<StateFunctionInput> => {
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
          seconds: c.pingpong!.delay,
        }
      }

      // Follow up state - check if pong was returned
      const conn = await c.mapper.get(connection)
      if (conn.hasPonged) {
        return {
          ...input,
          state: 'PING',
          seconds: c.pingpong!.timeout,
        }
      }

      await deleteConnection(c)({ ...input })
      return {
        ...input,
        state: 'ABORT',
      }
    }
