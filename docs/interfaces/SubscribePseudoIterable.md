[graphql-lambda-subscriptions](../README.md) / SubscribePseudoIterable

# Interface: SubscribePseudoIterable<T, TSubscribeArgs\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`PubSubEvent`](PubSubEvent.md) |
| `TSubscribeArgs` | extends [`SubscribeArgs`](../README.md#subscribeargs)[`SubscribeArgs`](../README.md#subscribeargs) |

## Callable

### SubscribePseudoIterable

▸ **SubscribePseudoIterable**(...`args`): `AsyncGenerator`<`T`, `never`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

#### Returns

`AsyncGenerator`<`T`, `never`, `unknown`\>

## Table of contents

### Properties

- [filter](SubscribePseudoIterable.md#filter)
- [topic](SubscribePseudoIterable.md#topic)

### Methods

- [onAfterSubscribe](SubscribePseudoIterable.md#onaftersubscribe)
- [onComplete](SubscribePseudoIterable.md#oncomplete)
- [onSubscribe](SubscribePseudoIterable.md#onsubscribe)

## Properties

### filter

• `Optional` **filter**: [`SubscriptionFilter`](../README.md#subscriptionfilter)<`TSubscribeArgs`, `T`[``"payload"``]\>

___

### topic

• **topic**: `string`

## Methods

### onAfterSubscribe

▸ `Optional` **onAfterSubscribe**(...`args`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

#### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onComplete

▸ `Optional` **onComplete**(...`args`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

#### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onSubscribe

▸ `Optional` **onSubscribe**(...`args`): [`MaybePromise`](../README.md#maybepromise)<`void` \| `GraphQLError`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

#### Returns

[`MaybePromise`](../README.md#maybepromise)<`void` \| `GraphQLError`[]\>
