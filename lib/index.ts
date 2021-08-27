import { ServerArgs, ServerClosure, SubscriptionServer } from './types'
import { publish } from './pubsub/publish'
import { complete } from './pubsub/complete'
import { handleWebSocketEvent } from './handleWebSocketEvent'
import { handleStepFunctionEvent } from './handleStepFunctionEvent'
import { makeServerClosure } from './makeServerClosure'

export const makeServer = (opts: ServerArgs): SubscriptionServer => {
  const closure: Promise<ServerClosure> = makeServerClosure(opts)

  return {
    webSocketHandler: handleWebSocketEvent(closure),
    stepFunctionsHandler: handleStepFunctionEvent(closure),
    publish: publish(closure),
    complete: complete(closure),
  }
}

export { subscribe } from './pubsub/subscribe'

export {
  ServerArgs,
  SubscriptionServer,
  APIGatewayWebSocketRequestContext,
  SubscribeOptions,
  SubscribeArgs,
  SubscribePseudoIterable,
  MaybePromise,
  ApiGatewayManagementApiSubset,
  APIGatewayWebSocketEvent,
  LoggerFunction,
  WebSocketResponse,
  StateFunctionInput,
  PubSubEvent,
  SubscriptionDefinition,
  SubscriptionFilter,
  Connection,
  Subscription,
} from './types'
