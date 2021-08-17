import { getOperationRootType } from 'graphql'
import {
  buildResolveInfo,
  collectFields,
  ExecutionContext,
  getFieldDef,
} from 'graphql/execution/execute'
import { addPath } from 'graphql/jsutils/Path'
import { ServerClosure } from '../types'

type ResolverAndArgs = [ReturnType<typeof getFieldDef>, null, ExecutionContext['variableValues'], ExecutionContext['contextValue'], ReturnType<typeof buildResolveInfo>]

export const getResolverAndArgs = (c: Omit<ServerClosure, 'gateway'>) => (execContext: ExecutionContext): ResolverAndArgs => {
  // Taken from graphql js - https://github.com/graphql/graphql-js/blob/main/src/subscription/subscribe.js#L190
  const type = getOperationRootType(c.schema, execContext.operation)
  const fields = collectFields(
    execContext,
    type,
    execContext.operation.selectionSet,
    Object.create(null),
    Object.create(null),
  )
  const responseNames = Object.keys(fields)
  const responseName = responseNames[0]
  const fieldNodes = fields[responseName]
  const fieldNode = fieldNodes[0]
  const fieldName = fieldNode.name.value
  const fieldDef = getFieldDef(c.schema, type, fieldName)
  const path = addPath(undefined, responseName, type.name)

  if (!fieldDef) {
    throw new Error('invalid schema, unknown field definition')
  }

  const info = buildResolveInfo(
    execContext,
    fieldDef,
    fieldNodes,
    type,
    path,
  )

  return [
    fieldDef,
    null,
    execContext.variableValues,
    execContext.contextValue,
    info,
  ]
}
