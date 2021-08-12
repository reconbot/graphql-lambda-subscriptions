import { SubscribeMessage, MessageType } from 'graphql-ws'
import { validate, parse } from 'graphql'
import {
  buildExecutionContext,
  assertValidExecutionArguments,
  execute,
} from 'graphql/execution/execute'
import { MessageHandler } from './types'
import { ServerClosure, SubscribeHandler } from '../types'
import { constructContext, getResolverAndArgs } from '../utils/graphql'
import { deleteConnection, sendMessage } from '../utils/aws'

/** Handler function for 'subscribe' message. */
export const subscribe: MessageHandler<SubscribeMessage> =
  async ({ c, event, message }) => {
    try {
      await setupSubscription({ c, event, message })
    } catch (err) {
      await c.onError?.(err, { event, message })
      await deleteConnection(c)(event.requestContext)
    }
  }

const setupSubscription: MessageHandler<SubscribeMessage> = async ({ c, event, message }) => {
  const connection = await c.mapper.get(
    Object.assign(new c.model.Connection(), {
      id: event.requestContext.connectionId!,
    }),
  )
  const connectionParams = connection.payload || {}

  // Check for variable errors
  const errors = validateMessage(c)(message)

  if (errors) {
    throw errors
  }

  const contextValue = await constructContext(c)({ connectionParams })

  const execContext = buildExecutionContext(
    c.schema,
    parse(message.payload.query),
    undefined,
    contextValue,
    message.payload.variables,
    message.payload.operationName,
    undefined,
  )

  if (!('operation' in execContext)) {
    return sendMessage(c)({
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
    const result = await execute(
      c.schema,
      parse(message.payload.query),
      undefined,
      contextValue,
      message.payload.variables,
      message.payload.operationName,
      undefined,
    )

    await sendMessage(c)({
      ...event.requestContext,
      message: {
        type: MessageType.Next,
        id: message.id,
        payload: result,
      },
    })

    await sendMessage(c)({
      ...event.requestContext,
      message: {
        type: MessageType.Complete,
        id: message.id,
      },
    })

    return
  }

  const [field, root, args, context, info] = getResolverAndArgs(c)(execContext)
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
    const subscription = Object.assign(new c.model.Subscription(), {
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
    await c.mapper.put(subscription)
  }))

  await onAfterSubscribe?.(root, args, context, info)
}

/** Validate incoming query and arguments */
const validateMessage = (c: ServerClosure) => (message: SubscribeMessage) => {
  const errors = validate(c.schema, parse(message.payload.query))

  if (errors && errors.length) {
    return errors
  }

  try {
    assertValidExecutionArguments(
      c.schema,
      parse(message.payload.query),
      message.payload.variables,
    )
  } catch (err) {
    return [err]
  }
}
