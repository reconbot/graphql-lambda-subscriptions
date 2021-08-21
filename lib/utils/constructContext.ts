/* eslint-disable @typescript-eslint/ban-types */
import { ServerClosure } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const constructContext = ({ server, connectionInitPayload, connectionId }: { connectionInitPayload: object, server: ServerClosure, connectionId: string }): any => {
  if (typeof server.context === 'function') {
    return server.context({ connectionInitPayload, connectionId })
  }
  return { ...server.context, connectionInitPayload, connectionId }
}
