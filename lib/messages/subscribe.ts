import AggregateError from 'aggregate-error'
import { SubscribeMessage, MessageType } from 'graphql-ws'
import { validate, parse } from 'graphql'
import {
  buildExecutionContext,
  assertValidExecutionArguments,
  execute,
} from 'graphql/execution/execute'
import { APIGatewayWebSocketEvent, ServerClosure, SubscribeHandler, MessageHandler } from '../types'
import { constructContext, getResolverAndArgs } from '../utils/graphql'
import { deleteConnection, sendMessage } from '../utils/aws'
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
  const connection = await server.mapper.get(
    Object.assign(new server.model.Connection(), {
      id: event.requestContext.connectionId!,
    }),
  )
  const connectionParams = connection.payload || {}

  // Check for variable errors
  const errors = validateMessage(server)(message)

  if (errors) {
    throw new AggregateError(errors)
  }

  const contextValue = await constructContext(server)({ connectionParams })

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
        type: MessageType.Next,
        id: message.id,
        payload: {
          errors: execContext,
        },
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

  const { topicDefinitions, onSubscribe, onAfterSubscribe } = await (field.subscribe as SubscribeHandler)(
    root,
    args,
    context,
    info,
  )

  await onSubscribe?.(root, args, context, info)

  await Promise.all(topicDefinitions.map(async ({ topic, filter }) => {
    const subscription = Object.assign(new server.model.Subscription(), {
      id: `${event.requestContext.connectionId}|${message.id}`,
      topic,
      filter: filter || {},
      subscriptionId: message.id,
      subscription: {
        variableValues: args,
        ...message.payload,
      },
      connectionId: event.requestContext.connectionId!,
      connectionParams,
      requestContext: event.requestContext,
      ttl: connection.ttl,
    })
    await server.mapper.put(subscription)
  }))

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

async function executeQuery(server: ServerClosure, message: SubscribeMessage, contextValue: any, event: APIGatewayWebSocketEvent) {
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

