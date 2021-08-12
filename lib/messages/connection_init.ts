import { StepFunctions } from 'aws-sdk'
import { ConnectionInitMessage, MessageType } from 'graphql-ws'
import { StateFunctionInput } from '../types'
import { deleteConnection, sendMessage } from '../utils/aws'
import { MessageHandler } from './types'

/** Handler function for 'connection_init' message. */
export const connection_init: MessageHandler<ConnectionInitMessage> =
  async ({ c, event, message }) => {
    try {
      const res = c.onConnectionInit
        ? await c.onConnectionInit({ event, message })
        : message.payload

      if (c.pingpong) {
        await new StepFunctions()
          .startExecution({
            stateMachineArn: c.pingpong.machine,
            name: event.requestContext.connectionId!,
            input: JSON.stringify({
              connectionId: event.requestContext.connectionId!,
              domainName: event.requestContext.domainName!,
              stage: event.requestContext.stage,
              state: 'PING',
              choice: 'WAIT',
              seconds: c.pingpong.delay,
            } as StateFunctionInput),
          })
          .promise()
      }

      // Write to persistence
      const connection = Object.assign(new c.model.Connection(), {
        id: event.requestContext.connectionId!,
        requestContext: event.requestContext,
        payload: res,
      })
      await c.mapper.put(connection)
      return sendMessage(c)({
        ...event.requestContext,
        message: { type: MessageType.ConnectionAck },
      })
    } catch (err) {
      await c.onError?.(err, { event, message })
      await deleteConnection(c)(event.requestContext)
    }
  }
