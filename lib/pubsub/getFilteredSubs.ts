/* eslint-disable @typescript-eslint/ban-types */
import {
  attributeNotExists,
  equals,
  ConditionExpression,
} from '@aws/dynamodb-expressions'
import { collect } from 'streaming-iterables'
import { Subscription } from '../model/Subscription'
import { ServerClosure, PubSubEvent } from '../types'

export const getFilteredSubs = async ({ server, event }: { server: Omit<ServerClosure, 'gateway'>, event: PubSubEvent }): Promise<Subscription[]> => {
  const flattenPayload = flatten(event.payload)
  const iterator = server.mapper.query(
    server.model.Subscription,
    { topic: equals(event.topic) },
    {
      filter: {
        type: 'And',
        conditions: Object.entries(flattenPayload).reduce(
          (p, [key, value]) => [
            ...p,
            {
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
            },
          ],
          [] as ConditionExpression[],
        ),
      },
      indexName: 'TopicIndex',
    },
  )

  return await collect(iterator)
}

export const flatten = (
  obj: object,
): Record<string, number | string | boolean> => {
  if (obj === undefined || obj === null) {
    return {}
  }
  return Object.entries(obj).reduce((p, [k1, v1]) => {
    if (v1 && typeof v1 === 'object') {
      const next = Object.entries(v1).reduce(
        (prev, [k2, v2]) => ({
          ...prev,
          [`${k1}.${k2}`]: v2,
        }),
        {},
      )
      return {
        ...p,
        ...flatten(next),
      }
    }

    if (typeof v1 === 'string' ||
      typeof v1 === 'number' ||
      typeof v1 === 'boolean') {
      return { ...p, [k1]: v1 }
    }

    return p
  }, {})
}
