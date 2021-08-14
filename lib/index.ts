import { ServerArgs, ServerClosure } from './types'
import { publish } from './pubsub/publish'
import { complete } from './pubsub/complete'
import { handleGatewayEvent } from './gateway'
import { handleStateMachineEvent } from './stepFunctionHandler'
import { makeServerClosure } from './makeServerClosure'

export const createInstance = (opts: ServerArgs) => {
  const closure: ServerClosure = makeServerClosure(opts)

  return {
    gatewayHandler: handleGatewayEvent(closure),
    stateMachineHandler: handleStateMachineEvent(closure),
    publish: publish(closure),
    complete: complete(closure),
  }
}

export * from './pubsub/subscribe'

export * from './types'
export { Subscription } from './model/Subscription'
export { Connection } from './model/Connection'
