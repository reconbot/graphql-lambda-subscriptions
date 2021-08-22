[graphql-lambda-subscriptions](../README.md) / SubscriptionServer

# Interface: SubscriptionServer

## Table of contents

### Methods

- [complete](SubscriptionServer.md#complete)
- [publish](SubscriptionServer.md#publish)
- [stepFunctionsHandler](SubscriptionServer.md#stepfunctionshandler)
- [webSocketHandler](SubscriptionServer.md#websockethandler)

## Methods

### complete

▸ **complete**(`event`): `Promise`<`void`\>

Send a complete message and end all relevant subscriptions. This might take some time depending on how many subscriptions there are.

The payload if present will be used to match against any filters the subscriptions might have.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Object` |
| `event.payload?` | `Record`<`string`, `any`\> |
| `event.topic` | `string` |

#### Returns

`Promise`<`void`\>

___

### publish

▸ **publish**(`event`): `Promise`<`void`\>

Publish an event to all relevant subscriptions. This might take some time depending on how many subscriptions there are.

The payload if present will be used to match against any filters the subscriptions might have.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Object` |
| `event.payload` | `Record`<`string`, `any`\> |
| `event.topic` | `string` |

#### Returns

`Promise`<`void`\>

___

### stepFunctionsHandler

▸ **stepFunctionsHandler**(`input`): `Promise`<[`StateFunctionInput`](StateFunctionInput.md)\>

The handler for your step functions powered ping/pong support

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`StateFunctionInput`](StateFunctionInput.md) |

#### Returns

`Promise`<[`StateFunctionInput`](StateFunctionInput.md)\>

___

### webSocketHandler

▸ **webSocketHandler**(`event`): `Promise`<[`WebSocketResponse`](../README.md#websocketresponse)\>

The handler for your websocket functions

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) |

#### Returns

`Promise`<[`WebSocketResponse`](../README.md#websocketresponse)\>
