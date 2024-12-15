import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi'
import {
  CompleteMessage,
  ConnectionAckMessage,
  ErrorMessage,
  NextMessage,
  PingMessage,
  PongMessage,
} from 'graphql-ws'
import { ServerClosure } from '../types'

type GraphqlWSMessages =
  | ConnectionAckMessage
  | NextMessage
  | CompleteMessage
  | ErrorMessage
  | PingMessage
  | PongMessage

export const postToConnection =
  (server: ServerClosure) =>
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

      const api =
      server.apiGatewayManagementApi ??
      new ApiGatewayManagementApi({
        // The key apiVersion is no longer supported in v3, and can be removed.
        // @deprecated The client uses the "latest" apiVersion.
        apiVersion: 'latest',

        // The transformation for endpoint is not implemented.
        // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
        // Please create/upvote feature request on aws-sdk-js-codemod for endpoint.
        endpoint: `https://${domainName}/${stage}`,
      })

      await api.postToConnection({
        ConnectionId,
        Data: JSON.stringify(message),
      })
    }
