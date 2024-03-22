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

export const postToConnection = (server: ServerClosure) =>
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
    server.log('sendMessage', { connectionId: ConnectionId, message })

    const api = server.apiGatewayManagementApi ??
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
      .catch(err => {
        if (err?.code !== 'GoneException') throw err
        console.warn('Connection already closed at API Gateway, ignoring')
      })
  }
