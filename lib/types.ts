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
  dynamodb: MaybePromise<DynamoDB>
  apiGatewayManagementApi?: MaybePromise<ApiGatewayManagementApiSubset>
  tableNames?: MaybePromise<Partial<TableNames>>
  /*
    Makes the context object for all operations defaults to { connectionInitPayload, connectionId }
  */
  context?: ((arg: { connectionInitPayload: any, connectionId: string }) => MaybePromise<object>) | object
  pingpong?: {
    machine: string
    delay: number
    timeout: number
  }
  onConnect?: (e: { event: APIGatewayWebSocketEvent }) => MaybePromise<void>
  onDisconnect?: (e: { event: APIGatewayWebSocketEvent }) => MaybePromise<void>
  /*
    Takes connection_init event and returns the connectionInitPayload to be persisted. Throw if you'd like the connection to be disconnected. Useful for auth.
  */
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
  /*
    Defaults to debug('graphql-lambda-subscriptions') from https://www.npmjs.com/package/debug
  */
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
  apiGatewayManagementApi?: ApiGatewayManagementApiSubset
} & Omit<ServerArgs, 'tableNames' | 'dynamodb'>

export interface ServerInstance {
  webSocketHandler: ApiSebSocketHandler<APIGatewayWebSocketEvent, WebSocketResponse>
  stateMachineHandler: (input: StateFunctionInput) => Promise<StateFunctionInput>
  publish: (event: PubSubEvent) => Promise<void>
  complete: (event: PartialBy<PubSubEvent, 'payload'>) => Promise<void>
}

export type TableNames = {
  connections: string
  subscriptions: string
}

export type LoggerFunction = (input: string, obj?: any) => void

export type WebSocketResponse = {
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

export type ApiSebSocketHandler<TEvent = any, TResult = any> = (event: TEvent) => Promise<TResult>

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
