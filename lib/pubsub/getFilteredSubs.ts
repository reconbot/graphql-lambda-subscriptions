/* eslint-disable @typescript-eslint/ban-types */
import {
  attributeNotExists,
  equals,
  ConditionExpression,
} from '@aws/dynamodb-expressions'
import { collect } from 'streaming-iterables'
import { Subscription } from '../model/Subscription'
import { ServerClosure, PubSubEvent, PartialBy } from '../types'

export const getFilteredSubs = async ({ server, event }: { server: Omit<ServerClosure, 'gateway'>, event: PartialBy<PubSubEvent, 'payload'> }): Promise<Subscription[]> => {
  if (!event.payload || Object.keys(event.payload).length === 0) {
    server.log('getFilteredSubs %j', { event })

    const iterator = server.mapper.query(
      server.model.Subscription,
      { topic: equals(event.topic) },
      { indexName: 'TopicIndex' },
    )

    return await collect(iterator)
  }
  const flattenPayload = collapseKeys(event.payload)
  const conditions: ConditionExpression[] = Object.entries(flattenPayload).map(([key, value]) => ({
    type: 'Or',
    conditions: [
      {
        ...attributeNotExists(),
        subject: `filter.${key}`,
      },
      {
        ...equals(value),
        subject: `filter.${key}`,
      },
    ],
  }))

  server.log('getFilteredSubs %j', { event, conditions })

  const iterator = server.mapper.query(
    server.model.Subscription,
    { topic: equals(event.topic) },
    {
      filter: {
        type: 'And',
        conditions,
      },
      indexName: 'TopicIndex',
    },
  )

  return await collect(iterator)
}

export const collapseKeys = (
  obj: object,
): Record<string, number | string | boolean> => {
  const record = {}
  for (const [k1, v1] of Object.entries(obj)) {
    if (typeof v1 === 'string' || typeof v1 === 'number' || typeof v1 === 'boolean') {
      record[k1] = v1
      continue
    }

    if (v1 && typeof v1 === 'object') {
      const next = {}

      for (const [k2, v2] of Object.entries(v1)) {
        next[`${k1}.${k2}`] = v2
      }

      for (const [k1, v1] of Object.entries(collapseKeys(next))) {
        record[k1] = v1
      }
    }
  }
  return record
}
