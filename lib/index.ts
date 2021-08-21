import { ServerArgs, ServerClosure, ServerInstance } from './types'
import { publish } from './pubsub/publish'
import { complete } from './pubsub/complete'
import { handleWebSocketEvent } from './handleWebSocketEvent'
import { handleStateMachineEvent } from './handleStateMachineEvent'
import { makeServerClosure } from './makeServerClosure'

export const createInstance = (opts: ServerArgs): ServerInstance => {
  const closure: Promise<ServerClosure> = makeServerClosure(opts)

  return {
    webSocketHandler: handleWebSocketEvent(closure),
    stateMachineHandler: handleStateMachineEvent(closure),
    publish: publish(closure),
    complete: complete(closure),
  }
}

export * from './pubsub/subscribe'
export {
  ServerArgs,
  ServerInstance,
  APIGatewayWebSocketRequestContext,
  SubscribeOptions,
  SubscribeArgs,
  SubscribePseudoIterable,
  MaybePromise,
  ApiGatewayManagementApiSubset,
  TableNames,
  APIGatewayWebSocketEvent,
  LoggerFunction,
  ApiSebSocketHandler,
  WebSocketResponse,
  StateFunctionInput,
  PubSubEvent,
  PartialBy,
  SubscriptionDefinition,
  SubscriptionFilter,
} from './types'
export { Subscription } from './model/Subscription'
export { Connection } from './model/Connection'
