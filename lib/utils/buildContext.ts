/* eslint-disable @typescript-eslint/ban-types */
import { complete as completeFactory } from '../pubsub/complete'
import { publish as publishFactory } from '../pubsub/publish'
import { ServerClosure } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildContext = ({ server, connectionInitPayload, connectionId }: { connectionInitPayload: object, server: ServerClosure, connectionId: string }): any => {
  const publish = publishFactory(server)
  const complete = completeFactory(server)
  if (typeof server.context === 'function') {
    return server.context({ connectionInitPayload, connectionId, publish, complete })
  }
  return { ...server.context, connectionInitPayload, connectionId, publish, complete }
}
