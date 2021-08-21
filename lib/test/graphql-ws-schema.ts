import ws from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import { makeExecutableSchema } from '@graphql-tools/schema'

const PORT = 4000

const typeDefs = `
  type Query {
    hello: String
  }
  type Subscription {
    greetings: String
    onSubscribeError: String
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello World!',
  },
  Subscription: {
    greetings:{
      subscribe: async function*(){
        yield { greetings:  'yoyo' }
        yield { greetings:  'hows it' }
        yield { greetings:  'howdy' }
      },
    },
    onSubscribeError: {
      // eslint-disable-next-line require-yield
      subscribe: async function*() {
        throw new Error('onSubscribeError')
      },
    },
  },
}


const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

export const startGqlWSServer = async () => {
  const server = new ws.Server({
    port: PORT,
    path: '/',
  })

  server.on('connection', connection => {
    // connection.on('message', msg => console.log({ msg: msg.toString() }))
    const send = connection.send
    connection.send = (data: any, cb: any) => {
      // console.log({ send: data })
      return send.call(connection, data, cb)
    }
    const close = connection.close
    connection.close = (code?: number | undefined, data?: string | undefined) => {
      // console.log({ close: { code, data: data?.toString() } })
      return close.call(connection, code, data)
    }
  })

  useServer(
    { schema },
    server,
  )

  await new Promise(resolve => server.on('listening', resolve))
  // console.log('server started')

  const close = () => new Promise<void>(resolve => server.close(() => resolve()))

  return {
    url: `ws://localhost:${PORT}`,
    close,
  }
}
