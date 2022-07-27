[graphql-lambda-subscriptions](../README.md) / ServerArgs

# Interface: ServerArgs

## Table of contents

### Properties

- [apiGatewayManagementApi](ServerArgs.md#apigatewaymanagementapi)
- [context](ServerArgs.md#context)
- [dynamodb](ServerArgs.md#dynamodb)
- [log](ServerArgs.md#log)
- [onConnect](ServerArgs.md#onconnect)
- [onConnectionInit](ServerArgs.md#onconnectioninit)
- [onDisconnect](ServerArgs.md#ondisconnect)
- [onError](ServerArgs.md#onerror)
- [onPing](ServerArgs.md#onping)
- [onPong](ServerArgs.md#onpong)
- [pingpong](ServerArgs.md#pingpong)
- [schema](ServerArgs.md#schema)
- [tableNames](ServerArgs.md#tablenames)

## Properties

### apiGatewayManagementApi

• `Optional` **apiGatewayManagementApi**: [`MaybePromise`](../README.md#maybepromise)<[`ApiGatewayManagementApiSubset`](ApiGatewayManagementApiSubset.md)\>

An optional ApiGatewayManagementApi object

___

### context

• `Optional` **context**: `object` \| (`arg`: { `complete`: (`event`: { `payload?`: `Record`<`string`, `any`\> ; `topic`: `string`  }) => `Promise`<`void`\> ; `connectionId`: `string` ; `connectionInitPayload`: `any` ; `publish`: (`event`: { `payload`: `Record`<`string`, `any`\> ; `topic`: `string`  }) => `Promise`<`void`\>  }) => [`MaybePromise`](../README.md#maybepromise)<`object`\>

Makes the context object for all operations defaults to { connectionInitPayload, connectionId }

___

### dynamodb

• **dynamodb**: [`MaybePromise`](../README.md#maybepromise)<`DynamoDB`\>

___

### log

• `Optional` **log**: [`LoggerFunction`](../README.md#loggerfunction)

Defaults to debug('graphql-lambda-subscriptions') from https://www.npmjs.com/package/debug

___

### onConnect

• `Optional` **onConnect**: (`e`: { `event`: [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md)  }) => [`MaybePromise`](../README.md#maybepromise)<`void`\>

#### Type declaration

▸ (`e`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `Object` |
| `e.event` | [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) |

##### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onConnectionInit

• `Optional` **onConnectionInit**: (`e`: { `event`: [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) ; `message`: `ConnectionInitMessage`  }) => [`MaybePromise`](../README.md#maybepromise)<`Record`<`string`, `any`\>\>

#### Type declaration

▸ (`e`): [`MaybePromise`](../README.md#maybepromise)<`Record`<`string`, `any`\>\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `Object` |
| `e.event` | [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) |
| `e.message` | `ConnectionInitMessage` |

##### Returns

[`MaybePromise`](../README.md#maybepromise)<`Record`<`string`, `any`\>\>

___

### onDisconnect

• `Optional` **onDisconnect**: (`e`: { `event`: [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md)  }) => [`MaybePromise`](../README.md#maybepromise)<`void`\>

#### Type declaration

▸ (`e`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `Object` |
| `e.event` | [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) |

##### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onError

• `Optional` **onError**: (`error`: `any`, `context`: `any`) => [`MaybePromise`](../README.md#maybepromise)<`void`\>

#### Type declaration

▸ (`error`, `context`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `any` |
| `context` | `any` |

##### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onPing

• `Optional` **onPing**: (`e`: { `event`: [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) ; `message`: `PingMessage`  }) => [`MaybePromise`](../README.md#maybepromise)<`void`\>

#### Type declaration

▸ (`e`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `Object` |
| `e.event` | [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) |
| `e.message` | `PingMessage` |

##### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### onPong

• `Optional` **onPong**: (`e`: { `event`: [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) ; `message`: `PongMessage`  }) => [`MaybePromise`](../README.md#maybepromise)<`void`\>

#### Type declaration

▸ (`e`): [`MaybePromise`](../README.md#maybepromise)<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `Object` |
| `e.event` | [`APIGatewayWebSocketEvent`](APIGatewayWebSocketEvent.md) |
| `e.message` | `PongMessage` |

##### Returns

[`MaybePromise`](../README.md#maybepromise)<`void`\>

___

### pingpong

• `Optional` **pingpong**: [`MaybePromise`](../README.md#maybepromise)<{ `delay`: `number` ; `machine`: `string` ; `timeout`: `number`  }\>

If set you can use the `stepFunctionsHandler` and a step function to setup a per connection ping/pong cycle to detect disconnects sooner than the 10 minute idle timeout.

___

### schema

• **schema**: `GraphQLSchema`

A GraphQL Schema with resolvers

You can use `makeExecutableSchema` from [`@graphql-tools/schema`](https://www.npmjs.com/package/@graphql-tools/schema), or `makeSchema` from [`nexus`](https://nexusjs.org/)

```ts
import { makeExecutableSchema } from '@graphql-tools/schema
// or
import { makeSchema } from 'nexus'
```

___

### tableNames

• `Optional` **tableNames**: [`MaybePromise`](../README.md#maybepromise)<{ `connections?`: `string` ; `subscriptions?`: `string`  }\>

An optional object or a promise for an object with DDB table names.

Defaults to `{ connections: 'graphql_connections', subscriptions: 'graphql_subscriptions' }`
