/* eslint-disable @typescript-eslint/ban-types */
import {
  PubSubEvent,
  SubscribeArgs,
  SubscribeHandler,
  SubscribePsuedoIterable,
  SubscriptionDefinition,
} from '../types'

/** Creates subscribe handler */
export const subscribe = (
  topic: string,
  {
    filter,
    onSubscribe,
    onComplete,
    onAfterSubscribe,
  }: {
    filter?: object | ((...args: SubscribeArgs) => object)
    onSubscribe?: (...args: SubscribeArgs) => void | Promise<void>
    onComplete?: (...args: SubscribeArgs) => void | Promise<void>
    onAfterSubscribe?: (...args: SubscribeArgs) => PubSubEvent | Promise<PubSubEvent> | undefined | Promise<undefined>
  } = {}): (...args: SubscribeArgs) => SubscribePsuedoIterable => {
  return (...args: SubscribeArgs) => {
    const handler = createHandler([{
      topic,
      filter: typeof filter === 'function' ? filter(...args) : filter,
    }])

    handler.onSubscribe = onSubscribe
    handler.onComplete = onComplete
    handler.onAfterSubscribe = onAfterSubscribe

    return handler
  }
}

/** Merge multiple subscribe handlers */
export const concat =
  (...handlers: SubscribeHandler[]) =>
    (...args: SubscribeArgs): SubscribePsuedoIterable =>
      createHandler( handlers.map((h) => h(...args).topicDefinitions).flat() )

const createHandler = (topicDefinitions: SubscriptionDefinition[]) => {
  // eslint-disable-next-line require-yield
  const handler: any = function *() {
    throw new Error('Subscription handler should not have been called')
  }
  handler.topicDefinitions = topicDefinitions
  return handler as SubscribePsuedoIterable
}
