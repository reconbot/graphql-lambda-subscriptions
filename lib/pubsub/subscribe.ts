/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybePromise, PubSubEvent, SubscribeArgs, SubscribeOptions, SubscribePseudoIterable } from '../types'

/**
 * Creates subscribe handler for use in your graphql schema.
 *
 * `subscribe` is the most important method in the library. It is the primary difference between `graphql-ws` and `graphql-lambda-subscriptions`. It returns a {@link SubscribePseudoIterable} that pretends to be an async iterator that you put on the `subscribe` resolver for your Subscription. In reality it includes a few properties that we use to subscribe to events and fire lifecycle functions. See {@link SubscribeOptions} for information about the callbacks.
 *
 * @param topic - Subscriptions are made to a `string` topic and can be filtered based upon the topics payload.
 * @param options - Optional callbacks for filtering, and lifecycle events.
 */
export const subscribe = <T extends PubSubEvent, TRoot extends any = any, TArgs extends Record<string, any> = any, TContext extends any = any>(
  topic: T['topic'] | ((...args: SubscribeArgs) => MaybePromise<string>),
  options: SubscribeOptions<T, SubscribeArgs<TRoot, TArgs, TContext>> = {},
): SubscribePseudoIterable<T, SubscribeArgs<TRoot, TArgs, TContext>> => {
  const {
    filter,
    onSubscribe,
    onComplete,
    onAfterSubscribe,
  } = options
  const handler = createHandler<T>()
  handler.topic = topic
  handler.filter = filter
  handler.onSubscribe = onSubscribe
  handler.onComplete = onComplete
  handler.onAfterSubscribe = onAfterSubscribe

  return handler
}

const createHandler = <T extends PubSubEvent>() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,require-yield
  const handler: any = async function* () {
    throw new Error('Subscription handler should not have been called')
  }
  return handler as SubscribePseudoIterable<T>
}
