import { getOperationRootType } from 'graphql'
import {
  buildResolveInfo,
  collectFields,
  ExecutionContext,
  getFieldDef,
} from 'graphql/execution/execute'
import { getArgumentValues } from 'graphql/execution/values'
import { addPath } from 'graphql/jsutils/Path'
import { ServerClosure } from '../types'

interface ResolverAndArgs {
  field: ReturnType<typeof getFieldDef>
  root: null
  args: ExecutionContext['variableValues']
  context: ExecutionContext['contextValue']
  info: ReturnType<typeof buildResolveInfo>
}

export const getResolverAndArgs = ({ server, execContext }: { server: ServerClosure, execContext: ExecutionContext }): ResolverAndArgs => {
  // Taken from graphql-js - https://github.com/graphql/graphql-js/blob/main/src/subscription/subscribe.ts#L189
  const type = getOperationRootType(server.schema, execContext.operation)
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
  const field = getFieldDef(server.schema, type, fieldName)
  const path = addPath(undefined, responseName, type.name)

  if (!field) {
    throw new Error('invalid schema, unknown field definition')
  }

  const info = buildResolveInfo(
    execContext,
    field,
    fieldNodes,
    type,
    path,
  )

  const args = getArgumentValues(field, fieldNode, execContext.variableValues)
  const context = execContext.contextValue

  return {
    field,
    root: null,
    args,
    context,
    info,
  }
}
