import { StepFunctions } from 'aws-sdk'
import { ConnectionInitMessage, MessageType } from 'graphql-ws'
import { StateFunctionInput, MessageHandler } from '../types'
import { deleteConnection, sendMessage } from '../utils/aws'

/** Handler function for 'connection_init' message. */
export const connection_init: MessageHandler<ConnectionInitMessage> =
  async ({ server, event, message }) => {
    try {
      const res = server.onConnectionInit
        ? await server.onConnectionInit({ event, message })
        : message.payload

      if (server.pingpong) {
        await new StepFunctions()
          .startExecution({
            stateMachineArn: server.pingpong.machine,
            name: event.requestContext.connectionId!,
            input: JSON.stringify({
              connectionId: event.requestContext.connectionId!,
              domainName: event.requestContext.domainName!,
              stage: event.requestContext.stage,
              state: 'PING',
              choice: 'WAIT',
              seconds: server.pingpong.delay,
            } as StateFunctionInput),
          })
          .promise()
      }

      // Write to persistence
      const connection = Object.assign(new server.model.Connection(), {
        id: event.requestContext.connectionId!,
        requestContext: event.requestContext,
        payload: res,
      })
      await server.mapper.put(connection)
      return sendMessage(server)({
        ...event.requestContext,
        message: { type: MessageType.ConnectionAck },
      })
    } catch (err) {
      await server.onError?.(err, { event, message })
      await deleteConnection(server)(event.requestContext)
    }
  }
