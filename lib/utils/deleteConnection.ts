import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi'
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
      new ApiGatewayManagementApi({
        endpoint: `${domainName}/${stage}`,
      })

    await api.deleteConnection({ ConnectionId });
  }
