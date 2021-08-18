/* eslint-disable @typescript-eslint/no-explicit-any */
import { PubSubEvent, SubscribeArgs, SubscribeOptions, SubscribePseudoIterable, SubscriptionDefinition } from '../types'

/** Creates subscribe handler */
export const subscribe = <T extends PubSubEvent, TRoot extends any = any, TArgs extends Record<string, any> = any, TContext extends any = any>(
  topic: T['topic'],
  {
    filter,
    onSubscribe,
    onComplete,
    onAfterSubscribe,
  }: SubscribeOptions<T, SubscribeArgs<TRoot, TArgs, TContext>> = {},
): SubscribePseudoIterable<T, SubscribeArgs<TRoot, TArgs, TContext>> => {
  const handler = createHandler<T>([{
    topic,
    filter,
  }])

  handler.onSubscribe = onSubscribe
  handler.onComplete = onComplete
  handler.onAfterSubscribe = onAfterSubscribe

  return handler
}

const createHandler = <T extends PubSubEvent>(topicDefinitions: SubscriptionDefinition<T>[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,require-yield
  const handler: any = async function* () {
    throw new Error('Subscription handler should not have been called')
  }
  handler.topicDefinitions = topicDefinitions
  return handler as SubscribePseudoIterable<T>
}
