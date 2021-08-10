import { assert } from 'chai'
import fetch from 'node-fetch'
import { start as sandBoxStart, end as sandBoxStop } from '@architect/sandbox'
import { createClient } from 'graphql-ws'
import WebSocket from 'ws'
import { deferGenerator } from 'inside-out-async'
import { collect, map } from 'streaming-iterables'

before(async () => {
  await sandBoxStart({ port: '3339', cwd: './mocks/arc-basic-events' } as any)
})

after(async () => {
  await sandBoxStop()
})

const pollURl = (url: string, timeout: number) => {
  const interval = setInterval(() => {
    fetch(url)
  }, timeout)

  fetch(url)

  const cancel = () => {
    if (interval) {
      clearInterval(interval)
    }
  }

  return cancel
}

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

    // I need this because I don't know when the subscription actually occurs server side.
    // This requests sends a bunch of data and completes the subscription
    // The better way is to be able to send a websocket event back to the client confirming the subscription
    // this isn't part of the graphql-ws spec, but an onSubscribe data event would be a good feature to have
    // and could be abused for this purpose
    const cancelFetch = pollURl('http://localhost:3339/', 1000)

    const greetings = await collect(map((value: { greetings: string }) => value.greetings, values))
    assert.deepEqual(greetings, ['hi', 'hey!'])
    cancelFetch()
    unsubscribe()
  })
})
