import { ApiGatewayManagementApiClient, DeleteConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { ServerClosure } from '../types'

export const deleteConnection = (server: ServerClosure) =>
  async ({
    connectionId: ConnectionId,
    domainName,
    stage,
  }:{
    connectionId: string
    domainName: string
    stage: string
  }): Promise<void> => {
    server.log('deleteConnection', { connectionId: ConnectionId })
    const api = server.apiGatewayManagementApi ??
      new ApiGatewayManagementApiClient({
        apiVersion: 'latest',
        endpoint: `${domainName}/${stage}`,
      })

    await api.send(new DeleteConnectionCommand({ ConnectionId }))
  }
