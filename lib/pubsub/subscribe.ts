import { SubscribeArgs, SubscribeHandler, SubscribeOptions, SubscribePseudoIterable, SubscriptionDefinition } from '../types'

/** Creates subscribe handler */
export const subscribe = (
  topic: string,
  {
    filter,
    onSubscribe,
    onComplete,
    onAfterSubscribe,
  }: SubscribeOptions = {}): (...args: SubscribeArgs) => SubscribePseudoIterable => {
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
export const concat = (...handlers: SubscribeHandler[]) => (...args: SubscribeArgs): SubscribePseudoIterable => createHandler(handlers.map((h) => h(...args).topicDefinitions).flat())

const createHandler = (topicDefinitions: SubscriptionDefinition[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,require-yield
  const handler: any = async function* () {
    throw new Error('Subscription handler should not have been called')
  }
  handler.topicDefinitions = topicDefinitions
  return handler as SubscribePseudoIterable
}
