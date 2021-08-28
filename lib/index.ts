import { ServerArgs, ServerClosure, SubscriptionServer } from './types'
import { publish } from './pubsub/publish'
import { complete } from './pubsub/complete'
import { handleWebSocketEvent } from './handleWebSocketEvent'
import { handleStepFunctionEvent } from './handleStepFunctionEvent'
import { buildServerClosure } from './buildServerClosure'

export const makeServer = (opts: ServerArgs): SubscriptionServer => {
  const closure: Promise<ServerClosure> = buildServerClosure(opts)

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
  SubscriptionFilter,
  Connection,
  Subscription,
} from './types'
