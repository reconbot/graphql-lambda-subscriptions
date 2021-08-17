import { DynamoDbTable } from '@aws/dynamodb-data-mapper'
import { Class } from '../types'

export const createModel = <T extends Class>({
  model,
  table,
}: {
  table: string
  model: T
}): T => {
  Object.defineProperties(model.prototype, {
    [DynamoDbTable]: { value: table },
  })
  return model
}
