/* eslint-disable @typescript-eslint/no-explicit-any */
import { start, end } from '@architect/sandbox'
import { assert } from 'chai'
import { join } from 'path'
import { mockServerContext } from '../test/mockServer'
import { collapseKeys, getFilteredSubs } from './getFilteredSubs'

describe('collapseKeys', () => {
  it('makes the deep objects into dots', () => {
    assert.deepEqual(collapseKeys({}), {})
    assert.deepEqual(
      collapseKeys({ a: 4, b: { c: 5, d: 'hi', e: { f: false } } }),
      {
        a: 4,
        'b.c': 5,
        'b.d': 'hi',
        'b.e.f': false,
      },
    )
    assert.deepEqual(
      collapseKeys({ a: [1, 2, 3, { b: 4, c: [], d: null, e: undefined }] }),
      {
        'a.0': 1,
        'a.1': 2,
        'a.2': 3,
        'a.3.b': 4,
      },
    )
  })
})

// since we're not resetting the db every time we need to change this
let count = 1
const makeTopic = () => `topic-${count++}`

describe('getFilteredSubs', () => {
  before(async () => {
    await start({ cwd: join(process.cwd(),'./mocks/arc-basic-events'), quiet: true })
  })

  after(async () => {
    await end()
  })

  it('can match on no filter', async () => {
    const topic = makeTopic()
    const server = await mockServerContext()
    const subscription = {
      id: '1',
      topic,
      filter: {},
      subscriptionId: '1',
      subscription: {} as any,
      connectionId: 'abcd',
      connectionInitPayload: {},
      requestContext: {} as any,
      ttl: Math.floor(Date.now() / 1000) + 100000,
      createdAt: Date.now(),
    }

    await server.models.subscription.put(subscription)
    assert.containSubset(
      await getFilteredSubs({
        server,
        event: { topic, payload: { language: 'en' } },
      }),
      [{ topic, id: '1' }],
    )
  })

  it('can match on payload', async () => {
    const topic = makeTopic()
    const server = await mockServerContext()
    const subscription = {
      id: '2',
      topic,
      filter: { language: 'en' },
      subscriptionId: '2',
      subscription: {} as any,
      connectionId: 'abcd',
      connectionInitPayload: {},
      requestContext: {} as any,
      ttl: Math.floor(Date.now() / 1000) + 100000,
      createdAt: Date.now(),
    }

    await server.models.subscription.put(subscription)

    assert.containSubset(
      await getFilteredSubs({
        server,
        event: { topic, payload: { language: 'en' } },
      }),
      [{ topic, id: '2' }],
    )
    assert.deepEqual(
      await getFilteredSubs({
        server,
        event: { topic, payload: { language: 'en-gb' } },
      }),
      [],
    )
  })

  it('can match on nested payload', async () => {
    const topic = makeTopic()
    const server = await mockServerContext()
    const subscription = {
      id: '2',
      topic,
      filter: { meta: { user: 'foo' }, message: { content: 'hi' } },
      subscriptionId: '2',
      subscription: {} as any,
      connectionId: 'abcd',
      connectionInitPayload: {},
      requestContext: {} as any,
      ttl: Math.floor(Date.now() / 1000) + 100000,
      createdAt: Date.now(),
    }

    await server.models.subscription.put(subscription)

    assert.containSubset(
      await getFilteredSubs({
        server,
        event: {
          topic,
          payload: { meta: { user: 'foo' }, message: { content: 'hi' } },
        },
      }),
      [{ topic, id: '2' }],
    )
    assert.deepEqual(
      await getFilteredSubs({
        server,
        event: {
          topic,
          payload: { meta: { user: 'lol' }, message: { content: 'bye' } },
        },
      }),
      [],
    )
  })

  it('can match on no payload', async () => {
    const topic = makeTopic()
    const server = await mockServerContext()
    const subscription = {
      id: '1234567',
      topic,
      filter: { language: 'en ' },
      subscriptionId: '12345',
      subscription: {} as any,
      connectionId: '1234',
      connectionInitPayload: {},
      requestContext: {} as any,
      ttl: Math.floor(Date.now() / 1000) + 100000,
      createdAt: Date.now(),
    }

    await server.models.subscription.put(subscription)
    const subscriptions = await getFilteredSubs({ server, event: { topic } })
    assert.containSubset(subscriptions, [{ topic, id: '1234567' }])
  })
  it('can match on connectionId')
  it('can match on topic key')
})
