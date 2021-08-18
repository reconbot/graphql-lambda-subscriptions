import { createClient } from 'graphql-ws'
import WebSocket from 'ws'
import { deferGenerator } from 'inside-out-async'

const url = `ws://localhost:${process.env.PORT}`

export const executeQuery = async (query: string): Promise<unknown> => {
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

type SubscriptionResult = Promise<{
  values: AsyncGenerator<unknown, unknown, unknown>
  unsubscribe: () => void
}>

export const executeSubscription = async (query: string): SubscriptionResult => {
  const client = createClient({
    url,
    webSocketImpl: WebSocket,
  })

  const values = deferGenerator()

  const unsubscribe = client.subscribe(
    { query },
    {
      next: ({ data }) => {
        // console.log({ data })
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
