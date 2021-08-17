/* eslint-disable @typescript-eslint/ban-types */
import { ServerClosure } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const constructContext = ({ server, connectionParams, connectionId }: { connectionParams: object, server: ServerClosure, connectionId: string }): any => {
  if (typeof server.context === 'function') {
    return server.context({ connectionParams, connectionId })
  }
  return { ...server.context, connectionParams, connectionId }
}
