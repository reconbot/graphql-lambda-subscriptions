import { ApiGatewayManagementApi } from 'aws-sdk'
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
        apiVersion: 'latest',
        endpoint: `${domainName}/${stage}`,
      })

    await api.deleteConnection({ ConnectionId }).promise()
  }
