import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda'
import { SubscribeMessage, MessageType } from 'graphql-ws'
import { validate, parse } from 'graphql'
import {
  buildExecutionContext,
  assertValidExecutionArguments,
  execute,
} from 'graphql/execution/execute'
import { ServerClosure, MessageHandler, SubscribePseudoIterable, PubSubEvent, Subscription } from '../types'
import { buildContext } from '../utils/buildContext'
import { getResolverAndArgs } from '../utils/getResolverAndArgs'
import { postToConnection } from '../utils/postToConnection'
import { deleteConnection } from '../utils/deleteConnection'
import { isArray } from '../utils/isArray'

/** Handler function for 'subscribe' message. */
export const subscribe: MessageHandler<SubscribeMessage> =
  async ({ server, event, message }) => {
    try {
      await setupSubscription({ server, event, message })
    } catch (err) {
      server.log('subscribe:error', { connectionId: event.requestContext.connectionId, error: err.message })
      await server.onError?.(err, { event, message })
      await deleteConnection(server)(event.requestContext)
    }
  }

const setupSubscription: MessageHandler<SubscribeMessage> = async ({ server, event, message }) => {
  const connectionId = event.requestContext.connectionId
  server.log('subscribe', { connectionId, messageId: message.id, query: message.payload.query })

  const connection = await server.models.connection.get({ id: connectionId })
  if (!connection) {
    throw new Error('missing subscription record')
  }

  // Check for variable errors
  const errors = validateMessage(server)(message)
  if (errors) {
    server.log('subscribe:validateError', errors)
    return postToConnection(server)({
      ...event.requestContext,
      message: {
        type: MessageType.Error,
        id: message.id,
        payload: errors,
      },
    })
  }

  const contextValue = await buildContext({ server, connectionInitPayload: connection.payload, connectionId })

  const execContext = buildExecutionContext({
    schema: server.schema,
    document: parse(message.payload.query),
    contextValue,
    variableValues: message.payload.variables,
    operationName: message.payload.operationName,
  })

  if (isArray(execContext)) {
    return postToConnection(server)({
      ...event.requestContext,
      message: {
        type: MessageType.Error,
        id: message.id,
        payload: execContext,
      },
    })
  }

  const subscriptionId = `${connection.id}|${message.id}`
  if (await server.models.subscription.get({ id: subscriptionId })) {
    throw new Error(`Subscriber for ${message.id} already exists`)
  }

  if (execContext.operation.operation !== 'subscription') {
    await executeQuery(server, message, contextValue, event)
    return
  }

  const { field, root, args, context, info } = getResolverAndArgs({ execContext })
  if (!field) {
    throw new Error('No field')
  }

  const { topic, filter, onSubscribe, onAfterSubscribe } = field.subscribe as SubscribePseudoIterable<PubSubEvent>

  server.log('onSubscribe', { onSubscribe: !!onSubscribe })
  const onSubscribeErrors = await onSubscribe?.(root, args, context, info)
  if (onSubscribeErrors) {
    server.log('onSubscribe', { onSubscribeErrors })
    return postToConnection(server)({
      ...event.requestContext,
      message: {
        type: MessageType.Error,
        id: message.id,
        payload: onSubscribeErrors,
      },
    })
  }

  const filterData = typeof filter === 'function' ? await filter(root, args, context, info) : filter

  const subscription: Subscription = {
    id: subscriptionId,
    topic,
    filter: filterData || {},
    subscriptionId: message.id,
    subscription: message.payload,
    connectionId: connection.id,
    connectionInitPayload: connection.payload,
    requestContext: event.requestContext,
    ttl: connection.ttl,
    createdAt: Date.now(),
  }
  server.log('subscribe:putSubscription', subscription)
  try {
    await server.models.subscription.put(subscription, {
      ConditionExpression: '#id <> :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
        ':id': subscriptionId,
      },
    })
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new Error(`Subscriber for ${message.id} already exists`)
    }
    throw error
  }

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
async function executeQuery(server: ServerClosure, message: SubscribeMessage, contextValue: any, event: APIGatewayProxyWebsocketEventV2) {
  server.log('executeQuery', { connectionId: event.requestContext.connectionId, query: message.payload.query })

  const result = await execute({
    schema: server.schema,
    document: parse(message.payload.query),
    contextValue,
    variableValues: message.payload.variables,
    operationName: message.payload.operationName,
  })

  await postToConnection(server)({
    ...event.requestContext,
    message: {
      type: MessageType.Next,
      id: message.id,
      payload: result,
    },
  })

  await postToConnection(server)({
    ...event.requestContext,
    message: {
      type: MessageType.Complete,
      id: message.id,
    },
  })
}
