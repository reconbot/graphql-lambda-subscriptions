import { assert } from 'chai'
import { start as sandBoxStart, end as sandBoxStop } from '@architect/sandbox'
import { createClient } from 'graphql-ws'
import WebSocket from 'ws'
import { deferGenerator } from 'inside-out-async'
import { collect, map } from 'streaming-iterables'

const url = `ws://localhost:${process.env.PORT}`

const executeQuery = async (query: string) => {
  const client = createClient({
    url,
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
    url,
    webSocketImpl: WebSocket,
  })

  const values = deferGenerator()

  const unsubscribe = client.subscribe(
    { query },
    {
      next: ({ data }) => {
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
  before(async () => {
    await sandBoxStart({ cwd: './mocks/arc-basic-events', quiet: true })
  })

  after(async () => {
    await new Promise(resolve => setTimeout(resolve, 100)) // pending ddb writes need to finish
    await sandBoxStop()
  })
  it('queries', async () => {
    const result = await executeQuery('{ hello }')
    assert.deepEqual(result, { hello: 'Hello World!' })
  })

  it('subscribes', async () => {
    const { values } = await executeSubscription('subscription { greetings }')
    const greetings = await collect(map((value: { greetings: string }) => value.greetings, values))
    assert.deepEqual(greetings, ['yoyo', 'hows it', 'howdy'])
  })
})
