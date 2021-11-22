graphql-lambda-subscriptions

# graphql-lambda-subscriptions

## Table of contents

### Interfaces

- [APIGatewayWebSocketEvent](interfaces/APIGatewayWebSocketEvent.md)
- [APIGatewayWebSocketRequestContext](interfaces/APIGatewayWebSocketRequestContext.md)
- [ApiGatewayManagementApiSubset](interfaces/ApiGatewayManagementApiSubset.md)
- [PubSubEvent](interfaces/PubSubEvent.md)
- [ServerArgs](interfaces/ServerArgs.md)
- [StateFunctionInput](interfaces/StateFunctionInput.md)
- [SubscribeOptions](interfaces/SubscribeOptions.md)
- [SubscribePseudoIterable](interfaces/SubscribePseudoIterable.md)
- [SubscriptionServer](interfaces/SubscriptionServer.md)

### Type aliases

- [LoggerFunction](README.md#loggerfunction)
- [MaybePromise](README.md#maybepromise)
- [SubscribeArgs](README.md#subscribeargs)
- [SubscriptionFilter](README.md#subscriptionfilter)
- [WebSocketResponse](README.md#websocketresponse)

### Functions

- [makeServer](README.md#makeserver)
- [subscribe](README.md#subscribe)

## Type aliases

### LoggerFunction

Ƭ **LoggerFunction**: (`message`: `string`, `obj`: `Record`<`string`, `any`\>) => `void`

#### Type declaration

▸ (`message`, `obj`): `void`

Log operational events with a logger of your choice. It will get a message and usually object with relevant data

##### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `obj` | `Record`<`string`, `any`\> |

##### Returns

`void`

___

### MaybePromise

Ƭ **MaybePromise**<`T`\>: `T` \| `Promise`<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

___

### SubscribeArgs

Ƭ **SubscribeArgs**<`TRoot`, `TArgs`, `TContext`\>: [root: TRoot, args: TArgs, context: TContext, info: GraphQLResolveInfo]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRoot` | `unknown` |
| `TArgs` | `Record`<`string`, `any`\> |
| `TContext` | `unknown` |

___

### SubscriptionFilter

Ƭ **SubscriptionFilter**<`TSubscribeArgs`, `TReturn`\>: `Partial`<`TReturn`\> \| `void` \| (...`args`: `TSubscribeArgs`) => [`MaybePromise`](README.md#maybepromise)<`Partial`<`TReturn`\> \| `void`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TSubscribeArgs` | extends [`SubscribeArgs`](README.md#subscribeargs) = [`SubscribeArgs`](README.md#subscribeargs) |
| `TReturn` | extends `Record`<`string`, `any`\> = `Record`<`string`, `any`\> |

___

### WebSocketResponse

Ƭ **WebSocketResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `body` | `string` |
| `headers?` | `Record`<`string`, `string`\> |
| `statusCode` | `number` |

## Functions

### makeServer

▸ `Const` **makeServer**(`opts`): [`SubscriptionServer`](interfaces/SubscriptionServer.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | [`ServerArgs`](interfaces/ServerArgs.md) |

#### Returns

[`SubscriptionServer`](interfaces/SubscriptionServer.md)

___

### subscribe

▸ `Const` **subscribe**<`T`, `TRoot`, `TArgs`, `TContext`\>(`topic`, `options?`): [`SubscribePseudoIterable`](interfaces/SubscribePseudoIterable.md)<`T`, [`SubscribeArgs`](README.md#subscribeargs)<`TRoot`, `TArgs`, `TContext`\>\>

Creates subscribe handler for use in your graphql schema.

`subscribe` is the most important method in the library. It is the primary difference between `graphql-ws` and `graphql-lambda-subscriptions`. It returns a [SubscribePseudoIterable](interfaces/SubscribePseudoIterable.md) that pretends to be an async iterator that you put on the `subscribe` resolver for your Subscription. In reality it includes a few properties that we use to subscribe to events and fire lifecycle functions. See [SubscribeOptions](interfaces/SubscribeOptions.md) for information about the callbacks.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`PubSubEvent`](interfaces/PubSubEvent.md) |
| `TRoot` | extends `unknown` = `any` |
| `TArgs` | extends `Record`<`string`, `any`\> = `any` |
| `TContext` | extends `unknown` = `any` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `topic` | `T`[``"topic"``] | Subscriptions are made to a `string` topic and can be filtered based upon the topics payload. |
| `options` | [`SubscribeOptions`](interfaces/SubscribeOptions.md)<`T`, [`SubscribeArgs`](README.md#subscribeargs)<`TRoot`, `TArgs`, `TContext`\>\> | Optional callbacks for filtering, and lifecycle events. |

#### Returns

[`SubscribePseudoIterable`](interfaces/SubscribePseudoIterable.md)<`T`, [`SubscribeArgs`](README.md#subscribeargs)<`TRoot`, `TArgs`, `TContext`\>\>
