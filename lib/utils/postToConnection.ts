import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import {
  ConnectionAckMessage,
  NextMessage,
  CompleteMessage,
  ErrorMessage,
  PingMessage,
  PongMessage,
} from 'graphql-ws'
import { ServerClosure } from '../types'
import { fromUtf8 } from '@aws-sdk/util-utf8-browser'
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
      new ApiGatewayManagementApiClient({
        apiVersion: 'latest',
        endpoint: `${domainName}/${stage}`,
      })

    await api
      .send(new PostToConnectionCommand({
        ConnectionId,
        Data: fromUtf8(JSON.stringify(message)),
      }))
  }
