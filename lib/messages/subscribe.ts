import { SubscribeMessage, MessageType } from 'graphql-ws'
import { validate, parse } from 'graphql'
import {
  buildExecutionContext,
  assertValidExecutionArguments,
  execute,
} from 'graphql/execution/execute'
import { APIGatewayWebSocketEvent, ServerClosure, MessageHandler, SubscribePseudoIterable, PubSubEvent } from '../types'
import { constructContext } from '../utils/constructContext'
import { getResolverAndArgs } from '../utils/getResolverAndArgs'
import { sendMessage } from '../utils/sendMessage'
import { deleteConnection } from '../utils/deleteConnection'
import { isArray } from '../utils/isArray'

/** Handler function for 'subscribe' message. */
export const subscribe: MessageHandler<SubscribeMessage> =
  async ({ server, event, message }) => {
    try {
      await setupSubscription({ server, event, message })
    } catch (err) {
      await server.onError?.(err, { event, message })
      await deleteConnection(server)(event.requestContext)
    }
  }

const setupSubscription: MessageHandler<SubscribeMessage> = async ({ server, event, message }) => {
  const connectionId = event.requestContext.connectionId
  server.log('subscribe %j', { connectionId, query: message.payload.query })

  const connection = await server.mapper.get(
    Object.assign(new server.model.Connection(), {
      id: connectionId,
    }),
  )

  // Check for variable errors
  const errors = validateMessage(server)(message)

  if (errors) {
    server.log('subscribe:validateError', errors)
    return sendMessage(server)({
      ...event.requestContext,
      message: {
        type: MessageType.Error,
        id: message.id,
        payload: errors,
      },
    })
  }

  const contextValue = await constructContext({ server, connectionParams: connection.payload, connectionId })

  const execContext = buildExecutionContext(
    server.schema,
    parse(message.payload.query),
    undefined,
    contextValue,
    message.payload.variables,
    message.payload.operationName,
    undefined,
  )

  if (isArray(execContext)) {
    return sendMessage(server)({
      ...event.requestContext,
      message: {
        type: MessageType.Error,
        id: message.id,
        payload: execContext,
      },
    })
  }

  if (execContext.operation.operation !== 'subscription') {
    await executeQuery(server, message, contextValue, event)
    return
  }

  const [field, root, args, context, info] = getResolverAndArgs(server)(execContext)
  if (!field) {
    throw new Error('No field')
  }

  const { topicDefinitions, onSubscribe, onAfterSubscribe } = field.subscribe as SubscribePseudoIterable<PubSubEvent>

  server.log('onSubscribe', { onSubscribe: !!onSubscribe })
  const onSubscribeErrors = await onSubscribe?.(root, args, context, info)
  if (onSubscribeErrors){
    server.log('onSubscribe', { onSubscribeErrors })
    return sendMessage(server)({
      ...event.requestContext,
      message: {
        type: MessageType.Error,
        id: message.id,
        payload: onSubscribeErrors,
      },
    })
  }

  await Promise.all(topicDefinitions.map(async ({ topic, filter }) => {
    const filterData = typeof filter === 'function' ? await filter(root, args, context, info) : filter

    const subscription = Object.assign(new server.model.Subscription(), {
      id: `${connection.id}|${message.id}`,
      topic,
      filter: filterData || {},
      subscriptionId: message.id,
      subscription: {
        variableValues: args,
        ...message.payload,
      },
      connectionId: connection.id,
      connectionParams: connection.payload,
      requestContext: event.requestContext,
      ttl: connection.ttl,
    })
    server.log('subscribe:putSubscription %j', subscription)
    await server.mapper.put(subscription)
  }))

  server.log('onAfterSubscribe', { onAfterSubscribe: !!onAfterSubscribe })
  await onAfterSubscribe?.(root, args, context, info)
}

/** Validate incoming query and arguments */
const validateMessage = (server: ServerClosure) => (message: SubscribeMessage) => {
  const errors = validate(server.schema, parse(message.payload.query))

  if (errors && errors.length > 0) {
    return errors
  }

  try {
    assertValidExecutionArguments(
      server.schema,
      parse(message.payload.query),
      message.payload.variables,
    )
  } catch (err) {
    return [err]
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeQuery(server: ServerClosure, message: SubscribeMessage, contextValue: any, event: APIGatewayWebSocketEvent) {
  server.log('executeQuery', { connectionId: event.requestContext.connectionId, query: message.payload.query })

  const result = await execute(
    server.schema,
    parse(message.payload.query),
    undefined,
    contextValue,
    message.payload.variables,
    message.payload.operationName,
    undefined,
  )

  await sendMessage(server)({
    ...event.requestContext,
    message: {
      type: MessageType.Next,
      id: message.id,
      payload: result,
    },
  })

  await sendMessage(server)({
    ...event.requestContext,
    message: {
      type: MessageType.Complete,
      id: message.id,
    },
  })
}

