import { DynamoDbTable } from '@aws/dynamodb-data-mapper'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createModel = <T extends { new(...args: any[]): any }>({
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
