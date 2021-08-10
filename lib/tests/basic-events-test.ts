import { assert } from 'chai'
import fetch from 'node-fetch'
import { start as sandBoxStart, end as sandBoxEnd } from '@architect/sandbox'
import { createClient } from 'graphql-ws'
import WebSocket from 'ws'
import { deferGenerator } from 'inside-out-async'
import { collect, map } from 'streaming-iterables'

before(async () => {
  await sandBoxStart({ port: '3339', cwd: './mocks/arc-basic-events' } as any)
})

after(async () => {
  await sandBoxEnd()
})

const executeQuery = async (query: string) => {
  const client = createClient({
    url: 'ws://localhost:3339',
    webSocketImpl: WebSocket,
  })

  return new Promise((resolve, reject) => {
    let result
    client.subscribe(
      { query },
      {
        next: ({ data }) => (result = data),
        error: reject,
        complete: () => resolve(result),
      },
    )
  })
}

const executeSubscription = async (query: string) => {
  const client = createClient({
    url: 'ws://localhost:3339',
    webSocketImpl: WebSocket,
  })

  const values = deferGenerator()

  const unsubscribe = client.subscribe(
    { query },
    {
      next: ({data}) => {
        values.queueValue(data)
      },
      error: (error: Error) => {
        values.queueError(error)
      },
      complete: () => values.queueReturn(),
    },
  )

  return { values: values.generator, unsubscribe }
}

describe('Basic Events', () => {
  it('queries', async () => {
    const result = await executeQuery('{ hello }')
    assert.deepEqual(result, { hello: 'Hello World!' })
  })

  it('subscribes', async () => {
    const { values, unsubscribe } = await executeSubscription('subscription { greetings }')
    // this timeout sucks
    await new Promise(resolve => setTimeout(resolve, 2000))
    await fetch('http://localhost:3339/')
    const greetings = await collect(map((value: { greetings: string }) => value.greetings, values))
    assert.deepEqual(greetings, ['hi', 'hey!'])
    unsubscribe()
  })
})
