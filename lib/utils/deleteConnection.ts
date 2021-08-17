import { ApiGatewayManagementApi } from 'aws-sdk'
import { ServerClosure } from '../types'

export const deleteConnection = (c: ServerClosure) =>
  async ({
    connectionId: ConnectionId,
    domainName,
    stage,
  }:{
    connectionId: string
    domainName: string
    stage: string
  }): Promise<void> => {
    const api = c.apiGatewayManagementApi ??
      new ApiGatewayManagementApi({
        apiVersion: 'latest',
        endpoint: `${domainName}/${stage}`,
      })

    await api.deleteConnection({ ConnectionId }).promise()
  }
