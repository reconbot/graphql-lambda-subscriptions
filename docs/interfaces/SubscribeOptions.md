[graphql-lambda-subscriptions](../README.md) / SubscribeOptions

# Interface: SubscribeOptions<T, TSubscribeArgs\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`PubSubEvent`](PubSubEvent.md) |
| `TSubscribeArgs` | extends [`SubscribeArgs`](../README.md#subscribeargs) = [`SubscribeArgs`](../README.md#subscribeargs) |

## Table of contents

### Properties

- [filter](SubscribeOptions.md#filter)

### Methods

- [onAfterSubscribe](SubscribeOptions.md#onaftersubscribe)
- [onComplete](SubscribeOptions.md#oncomplete)
- [onSubscribe](SubscribeOptions.md#onsubscribe)

## Properties

### filter

• `Optional` **filter**: [`SubscriptionFilter`](../README.md#subscriptionfilter)<`TSubscribeArgs`, `T`[``"payload"``]\>

An object or a function that returns an object that will be matched against the `payload` of a published event. If the payload's field equals the filter the subscription will receive the event. If the payload is missing the filter's field the subscription will receive the event.

## Methods

### onAfterSubscribe

▸ `Optional` **onAfterSubscribe**(...`args`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

Gets resolver arguments to perform work after a subscription saved. This is useful for sending out initial events.

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

#### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onComplete

▸ `Optional` **onComplete**(...`args`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

Called at least once. Gets resolver arguments to perform work after a subscription has ended. This is useful for bookkeeping or logging. This callback will fire

If the client disconnects, sends a `complete` message, or the server sends a `complete` message via the pub/sub system. Because of the nature of aws lambda, it's possible for a client to send a "complete" message immediately disconnect and have those events execute on lambda out of order. Which why this function can be called up to twice.

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

#### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onSubscribe

▸ `Optional` **onSubscribe**(...`args`): [`MaybePromise`](../README.md#maybepromise)<`void` \| `GraphQLError`[]\>

Gets resolver arguments to perform work before a subscription is allowed. This is useful for checking arguments or
validating permissions. Return an array of GraphqlErrors if you don't want the subscription to subscribe.

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

#### Returns

[`MaybePromise`](../README.md#maybepromise)<`void` \| `GraphQLError`[]\>
