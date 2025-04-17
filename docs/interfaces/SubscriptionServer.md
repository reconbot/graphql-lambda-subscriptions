[graphql-lambda-subscriptions](../README.md) / SubscriptionServer

# Interface: SubscriptionServer

## Table of contents

### Properties

- [complete](SubscriptionServer.md#complete)
- [publish](SubscriptionServer.md#publish)
- [stepFunctionsHandler](SubscriptionServer.md#stepfunctionshandler)
- [webSocketHandler](SubscriptionServer.md#websockethandler)

## Properties

### complete

• **complete**: (`event`: { `payload?`: `Record`<`string`, `any`\> ; `topic`: `string` }, `excludeKeys?`: `string`[]) => `Promise`<`void`\>

#### Type declaration

▸ (`event`, `excludeKeys`): `Promise`<`void`\>

Send a complete message and end all relevant subscriptions. This might take some time depending on how many subscriptions there are.

The payload if present will be used to match against any filters the subscriptions might have.

##### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Object` |
| `event.payload?` | `Record`<`string`, `any`\> |
| `event.topic` | `string` |
| `excludeKeys?` | `string`[] |

##### Returns

`Promise`<`void`\>

___

### publish

• **publish**: (`event`: { `payload`: `Record`<`string`, `any`\> ; `topic`: `string` }, `excludeKeys?`: `string`[]) => `Promise`<`void`\>

#### Type declaration

▸ (`event`, `excludeKeys`): `Promise`<`void`\>

Publish an event to all relevant subscriptions. This might take some time depending on how many subscriptions there are.

The payload if present will be used to match against any filters the subscriptions might have.

##### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Object` |
| `event.payload` | `Record`<`string`, `any`\> |
| `event.topic` | `string` |
| `excludeKeys?` | `string`[] |

##### Returns

`Promise`<`void`\>

___

### stepFunctionsHandler

• **stepFunctionsHandler**: (`input`: [`StateFunctionInput`](StateFunctionInput.md)) => `Promise`<[`StateFunctionInput`](StateFunctionInput.md)\>

#### Type declaration

▸ (`input`): `Promise`<[`StateFunctionInput`](StateFunctionInput.md)\>

The handler for your step functions powered ping/pong support

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | [`StateFunctionInput`](StateFunctionInput.md) |

##### Returns

`Promise`<[`StateFunctionInput`](StateFunctionInput.md)\>

___

### webSocketHandler

• **webSocketHandler**: (`event`: [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md)) => `Promise`<[`WebSocketResponse`](../README.md#websocketresponse)\>

#### Type declaration

▸ (`event`): `Promise`<[`WebSocketResponse`](../README.md#websocketresponse)\>

The handler for your websocket functions

##### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) |

##### Returns

`Promise`<[`WebSocketResponse`](../README.md#websocketresponse)\>
