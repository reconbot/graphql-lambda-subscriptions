/* eslint-disable @typescript-eslint/no-explicit-any */
import { collect } from 'streaming-iterables'
import { ServerClosure, Subscription } from '../types'

export const getFilteredSubs = async ({ server, event, excludeKeys = [] }: { server: Omit<ServerClosure, 'gateway'>, event: { topic: string, payload?: Record<string, any> }, excludeKeys?: string[] }): Promise<Subscription[]> => {
  if (!event.payload || Object.keys(event.payload).length === 0) {
    server.log('getFilteredSubs', { event, excludeKeys })

    const iterator = server.models.subscription.query({
      IndexName: 'TopicIndex',
      ExpressionAttributeNames: { '#a': 'topic' },
      ExpressionAttributeValues: { ':1': event.topic },
      KeyConditionExpression: '#a = :1',
    })

    return await collect(iterator)
  }
  const flattenPayload = collapseKeys(event.payload, excludeKeys)

  const filterExpressions: string[] = []
  const expressionAttributeValues: { [key: string]: string | number | boolean } = {}
  const expressionAttributeNames: { [key: string]: string } = {}

  let attributeCounter = 0
  for (const [key, value] of Object.entries(flattenPayload)) {
    const aliasNumber = attributeCounter++
    expressionAttributeNames[`#${aliasNumber}`] = key
    expressionAttributeValues[`:${aliasNumber}`] = value
    filterExpressions.push(`(#filter.#${aliasNumber} = :${aliasNumber} OR attribute_not_exists(#filter.#${aliasNumber}))`)
  }

  server.log('getFilteredSubs', { event, excludeKeys, expressionAttributeNames, expressionAttributeValues, filterExpressions })

  const iterator = server.models.subscription.query({
    IndexName: 'TopicIndex',
    ExpressionAttributeNames: {
      '#hashKey': 'topic',
      '#filter': 'filter',
      ...expressionAttributeNames,
    },
    ExpressionAttributeValues: {
      ':hashKey': event.topic,
      ...expressionAttributeValues,
    },
    KeyConditionExpression: '#hashKey = :hashKey',
    FilterExpression: filterExpressions.join(' AND ') || undefined,
  })

  return await collect(iterator)
}

export const collapseKeys = (
  obj: Record<string, any>,
  excludeKeys: string[] = [],
  parent: string[] = [],
): Record<string, number | string | boolean> => {
  const record = {}
  for (const [k1, v1] of Object.entries(obj)) {
    const path = [...parent, k1]
    const key = path.join('.')
    if (excludeKeys.includes(key)) {
      continue
    }
    if (typeof v1 === 'string' || typeof v1 === 'number' || typeof v1 === 'boolean') {
      record[key] = v1
      continue
    }
    if (v1 && typeof v1 === 'object') {
      for (const [k2, v2] of Object.entries(collapseKeys(v1, excludeKeys, path))) {
        record[k2] = v2
      }
      continue
    }
  }
  return record
}
