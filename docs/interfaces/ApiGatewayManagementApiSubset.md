[graphql-lambda-subscriptions](../README.md) / ApiGatewayManagementApiSubset

# Interface: ApiGatewayManagementApiSubset

## Table of contents

### Methods

- [deleteConnection](ApiGatewayManagementApiSubset.md#deleteconnection)
- [postToConnection](ApiGatewayManagementApiSubset.md#posttoconnection)

## Methods

### deleteConnection

▸ **deleteConnection**(`input`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `Object` |
| `input.ConnectionId` | `string` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `promise` | () => `Promise`<`any`\> |

___

### postToConnection

▸ **postToConnection**(`input`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `Object` |
| `input.ConnectionId` | `string` |
| `input.Data` | `string` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `promise` | () => `Promise`<`any`\> |
