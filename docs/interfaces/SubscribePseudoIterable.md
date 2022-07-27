[graphql-lambda-subscriptions](../README.md) / SubscribePseudoIterable

# Interface: SubscribePseudoIterable<T, TSubscribeArgs\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`PubSubEvent`](PubSubEvent.md) |
| `TSubscribeArgs` | extends [`SubscribeArgs`](../README.md#subscribeargs) = [`SubscribeArgs`](../README.md#subscribeargs) |

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
- [onAfterSubscribe](SubscribePseudoIterable.md#onaftersubscribe)
- [onComplete](SubscribePseudoIterable.md#oncomplete)
- [onSubscribe](SubscribePseudoIterable.md#onsubscribe)
- [topic](SubscribePseudoIterable.md#topic)

## Properties

### filter

• `Optional` **filter**: [`SubscriptionFilter`](../README.md#subscriptionfilter)<`TSubscribeArgs`, `T`[``"payload"``]\>

___

### onAfterSubscribe

• `Optional` **onAfterSubscribe**: (...`args`: `TSubscribeArgs`) => [`MaybePromise`](../README.md#maybepromise)<`void`\>

#### Type declaration

▸ (...`args`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

##### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onComplete

• `Optional` **onComplete**: (...`args`: `TSubscribeArgs`) => [`MaybePromise`](../README.md#maybepromise)<`void`\>

#### Type declaration

▸ (...`args`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

##### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onSubscribe

• `Optional` **onSubscribe**: (...`args`: `TSubscribeArgs`) => [`MaybePromise`](../README.md#maybepromise)<`void` \| `GraphQLError`[]\>

#### Type declaration

▸ (...`args`): [`MaybePromise`](../README.md#maybepromise)<`void` \| `GraphQLError`[]\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `TSubscribeArgs` |

##### Returns

[`MaybePromise`](../README.md#maybepromise)<`void` \| `GraphQLError`[]\>

___

### topic

• **topic**: `string`
