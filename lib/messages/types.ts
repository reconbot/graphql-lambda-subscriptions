import { APIGatewayWebSocketEvent, ServerClosure } from '../types'

export type MessageHandler<T> = (arg: { c: ServerClosure, event: APIGatewayWebSocketEvent, message: T }) => Promise<void>
