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

type SubscriptionResult = {
  values: AsyncGenerator<unknown, unknown, unknown>
  unsubscribe: () => void
  close: () => Promise<void> | void
}

export const executeSubscription = (query: string, { lazy }: {lazy?: boolean} = {}): SubscriptionResult => {
  const client = createClient({
    url,
    webSocketImpl: WebSocket,
    lazy,
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

  const close = () => client.dispose()

  return { values: values.generator, unsubscribe, close }
}
