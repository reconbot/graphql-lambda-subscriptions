/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { ConnectionInitMessage, PingMessage, PongMessage } from 'graphql-ws'
import { DataMapper } from '@aws/dynamodb-data-mapper'
import { APIGatewayEventRequestContext, APIGatewayProxyEvent } from 'aws-lambda'
import { GraphQLError, GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { DynamoDB } from 'aws-sdk'
import { Subscription } from './model/Subscription'
import { Connection } from './model/Connection'

export type ServerArgs = {
  schema: GraphQLSchema
  dynamodb: DynamoDB
  apiGatewayManagementApi?: ApiGatewayManagementApiSubset
  context?: ((arg: { connectionParams: any, connectionId: string }) => MaybePromise<object>) | object
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
  onError?: (error: any, context: any) => MaybePromise<void>
  log?: LoggerFunction
}

export type MaybePromise<T> = T | Promise<T>

export type ServerClosure = {
  mapper: DataMapper
  model: {
    Subscription: typeof Subscription
    Connection: typeof Connection
  }
  log: LoggerFunction
} & Omit<ServerArgs, 'tableNames'>

export interface ServerInstance {
  gatewayHandler: ApiGatewayHandler<APIGatewayWebSocketEvent, WebsocketResponse>
  stateMachineHandler: (input: StateFunctionInput) => Promise<StateFunctionInput>
  publish: (event: PubSubEvent) => Promise<void>
  complete: (event: PartialBy<PubSubEvent, 'payload'>) => Promise<void>
}

export type TableNames = {
  connections: string
  subscriptions: string
}

export type LoggerFunction = (input: string, obj?: any) => void

export type WebsocketResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

export type SubscribeArgs<TRoot = any, TArgs = Record<string, any>, TContext = any> = [root: TRoot, args: TArgs, context: TContext, info: GraphQLResolveInfo]

export type SubscriptionFilter<
  TSubscribeArgs extends SubscribeArgs = SubscribeArgs,
  TReturn extends Record<string, any> = Record<string, any>
> = Partial<TReturn> | void | ((...args: TSubscribeArgs) => MaybePromise<Partial<TReturn> | void>)

export type SubscriptionDefinition<
T extends PubSubEvent,
TSubscribeArgs extends SubscribeArgs = SubscribeArgs,
> = {
  topic: string
  filter?: SubscriptionFilter<TSubscribeArgs, T['payload']>
}

export type SubscribeHandler = <T extends PubSubEvent>(...args: any[]) => SubscribePseudoIterable<T>

export type SubscribePseudoIterable<T extends PubSubEvent, TSubscribeArgs extends SubscribeArgs = SubscribeArgs> = {
  (...args: TSubscribeArgs): AsyncGenerator<T, never, unknown>
  topicDefinitions: SubscriptionDefinition<T, TSubscribeArgs>[]
  onSubscribe?: (...args: TSubscribeArgs) => MaybePromise<void|GraphQLError[]>
  onAfterSubscribe?: (...args: TSubscribeArgs) => MaybePromise<void>
  onComplete?: (...args: TSubscribeArgs) => MaybePromise<void>
}


export interface SubscribeOptions<T extends PubSubEvent, TSubscribeArgs extends SubscribeArgs = SubscribeArgs> {
  filter?: SubscriptionFilter<TSubscribeArgs, T['payload']>
  /**
   * A function that gets the subscription information (like field args) it can return an array of GraphqlErrors if you don't want the
   * subscription to subscribe. Gets resolver arguments to perform necessary work before a subscription is allowed (checking arguments,
   *  permissions, etc)
   */
  onSubscribe?: (...args: TSubscribeArgs) => MaybePromise<void|GraphQLError[]>
  onComplete?: (...args: TSubscribeArgs) => MaybePromise<void>
  onAfterSubscribe?: (...args: TSubscribeArgs) => MaybePromise<void>
}

export type StateFunctionInput = {
  connectionId: string
  domainName: string
  stage: string
  state: 'PING' | 'REVIEW' | 'ABORT'
  seconds: number
}

export interface APIGatewayWebSocketRequestContext extends APIGatewayEventRequestContext {
  connectionId: string
  domainName: string
}

export interface APIGatewayWebSocketEvent extends APIGatewayProxyEvent {
  requestContext: APIGatewayWebSocketRequestContext
}

export type PubSubEvent = {
  topic: string
  payload: Record<string, any>
}

export type MessageHandler<T> = (arg: { server: ServerClosure, event: APIGatewayWebSocketEvent, message: T }) => Promise<void>

/*
  Matches the ApiGatewayManagementApi class from aws-sdk but only provides the methods we use
*/
export interface ApiGatewayManagementApiSubset {
  postToConnection(input: { ConnectionId: string, Data: string }): { promise: () => Promise<void> }
  deleteConnection(input: { ConnectionId: string }): { promise: () => Promise<void> }
}

export type ApiGatewayHandler<TEvent = any, TResult = any> = (event: TEvent) => Promise<TResult>

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
