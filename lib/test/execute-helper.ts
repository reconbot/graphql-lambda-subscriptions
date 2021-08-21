import WebSocket from 'ws'
import { deferGenerator } from 'inside-out-async'

const URL = `ws://localhost:${process.env.PORT}`

const messageToString = (message) => {
  if (Buffer.isBuffer(message?.reason)) {
    message.reason = message.reason.toString()
  }
  return JSON.stringify(message)
}


export const executeQuery = async function* (query: string, {
  url = URL,
  stayConnected = false,
  timeout = 20_000,
}: {
  url?: string
  stayConnected?: boolean
  timeout?: number
} = {}): AsyncGenerator<unknown, void, unknown> {
  let id = 1
  const ws = new WebSocket(url, 'graphql-transport-ws')

  const incomingMessages = deferGenerator()

  ws.on('message', data => {
    const message = JSON.parse(data.toString())
    incomingMessages.queueValue(message)
    if (message.type === 'error' || message.type === 'complete') {
      incomingMessages.queueReturn()
    }
  })

  ws.on('error', error => {
    incomingMessages.queueValue( { type: 'websocketError', value: error.message })
    incomingMessages.queueReturn()
  })
  ws.on('close', (code, reason) => {
    incomingMessages.queueValue({ type: 'close', code, reason: reason.toString() })
    incomingMessages.queueReturn()
  })

  let timer: NodeJS.Timeout|null = null
  if (timeout) {
    timer = setTimeout(() => {
      incomingMessages.queueValue({ type: 'timeout', timeout })
      incomingMessages.queueReturn()
    }, timeout)
  }

  const send = (data: any) => new Promise<void>(resolve => ws.send(JSON.stringify(data), () => resolve()))

  await new Promise(resolve => ws.on('open', resolve))
  await send({ type: 'connection_init' })
  const connectionAck: any = (await incomingMessages.generator.next()).value
  if (connectionAck.type !== 'connection_ack') {
    throw new Error(`Bad ack ${messageToString(connectionAck)}`)
  }

  await send({
    id: `${id++}`,
    type: 'subscribe',
    payload: { query },
  })

  for await (const message of incomingMessages.generator) {
    const shouldStop = yield message
    if (shouldStop) {
      break
    }
  }

  if (!stayConnected){
    ws.close()
  }
  if (timer) {
    clearTimeout(timer)
  }
}


export const executeToComplete = async function (query: string, {
  url = URL,
}: {
  url?: string
} = {}): Promise<() => Promise<void>> {
  let id = 1
  const ws = new WebSocket(url, 'graphql-transport-ws')

  const incomingMessages = deferGenerator()

  ws.on('message', data => {
    const message = JSON.parse(data.toString())
    incomingMessages.queueValue(message)
    if (message.type === 'error' || message.type === 'complete') {
      incomingMessages.queueReturn()
    }
  })

  ws.on('error', error => {
    incomingMessages.queueValue( { type: 'websocketError', value: error.message })
    incomingMessages.queueReturn()
  })
  ws.on('close', (code, reason) => {
    incomingMessages.queueValue({ type: 'close', code, reason: reason.toString() })
    incomingMessages.queueReturn()
  })

  const send = (data: any) => new Promise<void>(resolve => ws.send(JSON.stringify(data), () => resolve()))

  await new Promise(resolve => ws.on('open', resolve))
  await send({ type: 'connection_init' })
  const connectionAck: any = (await incomingMessages.generator.next()).value
  if (connectionAck.type !== 'connection_ack') {
    throw new Error(`Bad ack ${messageToString(connectionAck)}`)
  }

  const subId = id++

  await send({
    id: `${subId}`,
    type: 'subscribe',
    payload: { query },
  })

  return () => send({
    id: `${subId}`,
    type: 'complete',
  })
}



export const executeToDisconnect = async function (query: string, {
  url = URL,
}: {
  url?: string
} = {}): Promise<() => void> {
  let id = 1
  const ws = new WebSocket(url, 'graphql-transport-ws')

  const incomingMessages = deferGenerator()

  ws.on('message', data => {
    const message = JSON.parse(data.toString())
    incomingMessages.queueValue(message)
    if (message.type === 'error' || message.type === 'complete') {
      incomingMessages.queueReturn()
    }
  })

  ws.on('error', error => {
    incomingMessages.queueValue( { type: 'websocketError', value: error.message })
    incomingMessages.queueReturn()
  })
  ws.on('close', (code, reason) => {
    incomingMessages.queueValue({ type: 'close', code, reason: reason.toString() })
    incomingMessages.queueReturn()
  })

  const send = (data: any) => new Promise<void>(resolve => ws.send(JSON.stringify(data), () => resolve()))

  await new Promise(resolve => ws.on('open', resolve))
  await send({ type: 'connection_init' })
  const connectionAck: any = (await incomingMessages.generator.next()).value
  if (connectionAck.type !== 'connection_ack') {
    throw new Error(`Bad ack ${messageToString(connectionAck)}`)
  }

  const subId = id++

  await send({
    id: `${subId}`,
    type: 'subscribe',
    payload: { query },
  })

  return () => ws.close()
}
