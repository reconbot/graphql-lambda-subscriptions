import { ApiGatewayManagementApi } from 'aws-sdk'
import {
  ConnectionAckMessage,
  NextMessage,
  CompleteMessage,
  ErrorMessage,
  PingMessage,
  PongMessage,
} from 'graphql-ws'
import { ServerClosure } from '../types'

type GraphqlWSMessages = ConnectionAckMessage | NextMessage | CompleteMessage | ErrorMessage | PingMessage | PongMessage

export const sendMessage = (c: ServerClosure) =>
  async ({
    connectionId: ConnectionId,
    domainName,
    stage,
    message,
  }: {
    connectionId: string
    domainName: string
    stage: string
    message: GraphqlWSMessages
  }): Promise<void> => {
    const api = c.apiGatewayManagementApi ??
      new ApiGatewayManagementApi({
        apiVersion: 'latest',
        endpoint: `${domainName}/${stage}`,
      })

    await api
      .postToConnection({
        ConnectionId,
        Data: JSON.stringify(message),
      })
      .promise()
  }
