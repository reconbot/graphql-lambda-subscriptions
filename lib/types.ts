/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { ConnectionInitMessage, PingMessage, PongMessage } from 'graphql-ws'
import { DataMapper } from '@aws/dynamodb-data-mapper'
import { APIGatewayEventRequestContext, APIGatewayProxyEvent } from 'aws-lambda'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { DynamoDB } from 'aws-sdk'
import { Subscription } from './model/Subscription'
import { Connection } from './model/Connection'

export type ServerArgs = {
  schema: GraphQLSchema
  dynamodb: DynamoDB
  apiGatewayManagementApi?: ApiGatewayManagementApiSubset
  context?: ((arg: { connectionParams: any }) => object) | object
  tableNames?: Partial<TableNames>
  pingpong?: {
    machine: string
    delay: number
    timeout: number
  }
  onConnect?: (e: { event: APIGatewayWebSocketEvent }) => MaybePromise<void>
  onDisconnect?: (e: { event: APIGatewayWebSocketEvent }) => MaybePromise<void>
  /* Takes connection_init event and returns payload to be persisted (may include auth steps) */
  onConnectionInit?: (e: {
    event: APIGatewayWebSocketEvent
    message: ConnectionInitMessage
  }) => MaybePromise<object>
  onPing?: (e: {
    event: APIGatewayWebSocketEvent
    message: PingMessage
  }) => MaybePromise<void>
  onPong?: (e: {
    event: APIGatewayWebSocketEvent
    message: PongMessage
  }) => MaybePromise<void>
  onError?: (error: any, context: any) => void
}

export type MaybePromise<T> = T | Promise<T>

export type ServerClosure = {
  mapper: DataMapper
  model: {
    Subscription: typeof Subscription
    Connection: typeof Connection
  }
} & Omit<ServerArgs, 'tableNames'>

export interface ServerInstance {
  gatewayHandler: ApiGatewayHandler<APIGatewayWebSocketEvent, WebsocketResponse>
  stateMachineHandler: (input: StateFunctionInput) => Promise<StateFunctionInput>
  publish: (event: PubSubEvent) => Promise<void>
  complete: (event: PubSubEvent) => Promise<void>
}

export type TableNames = {
  connections: string
  subscriptions: string
}

export type WebsocketResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

export type SubscriptionDefinition = {
  topic: string
  filter?: object | (() => void)
}

export type SubscribeHandler = (...args: any[]) => SubscribePsuedoIterable

export type SubscribePsuedoIterable = {
  (...args: SubscribeArgs): AsyncGenerator<never, never, unknown>
  topicDefinitions: SubscriptionDefinition[]
  onSubscribe?: (...args: SubscribeArgs) => void | Promise<void>
  onComplete?: (...args: SubscribeArgs) => void | Promise<void>
  onAfterSubscribe?: (...args: SubscribeArgs) => PubSubEvent | Promise<PubSubEvent> | void | Promise<void>
}

export type SubscribeArgs = [root: any, args: Record<string, any>, context: any, info: GraphQLResolveInfo]

export type Class = { new(...args: any[]): any }

export type StateFunctionInput = {
  connectionId: string
  domainName: string
  stage: string
  state: 'PING' | 'REVIEW' | 'ABORT'
  seconds: number
}

export interface APIGatewayWebSocketRequestContext
  extends APIGatewayEventRequestContext {
  connectionId: string
  domainName: string
}

export interface APIGatewayWebSocketEvent extends APIGatewayProxyEvent {
  requestContext: APIGatewayWebSocketRequestContext
}

export type PubSubEvent = {
  topic: string
  payload: any
}

export type MessageHandler<T> = (arg: { server: ServerClosure, event: APIGatewayWebSocketEvent, message: T }) => Promise<void>

/*
  Matches the ApiGatewayManagementApi class from aws-sdk but only provides the methods we use
*/
export interface ApiGatewayManagementApiSubset {
  postToConnection(input: { ConnectionId: string, Data: string }): { promise: () => Promise<void> }
  deleteConnection(input: { ConnectionId: string }): { promise: () => Promise<void> }
}

export interface SubscribeOptions {
  filter?: object | ((...args: SubscribeArgs) => object)
  onSubscribe?: (...args: SubscribeArgs) => void | Promise<void>
  onComplete?: (...args: SubscribeArgs) => void | Promise<void>
  onAfterSubscribe?: (...args: SubscribeArgs) => PubSubEvent | Promise<PubSubEvent> | void | Promise<void>
}

export type ApiGatewayHandler<TEvent = any, TResult = any> = (event: TEvent) => void | Promise<TResult>
