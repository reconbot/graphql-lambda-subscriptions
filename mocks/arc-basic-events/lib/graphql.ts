import { makeExecutableSchema } from '@graphql-tools/schema'
import { tables as arcTables, ws } from '@architect/functions'
import { makeServer, subscribe } from '../../../lib'
import { GraphQLError } from 'graphql'

const typeDefs = `
  type Query {
    hello: String
    dontResolve: String
  }
  type Subscription {
    greetings: String
    filterTest: String
    onSubscribeError: String
    sideChannel: String
    onCompleteTestClientDisconnect: String
    onResolveError: String
    onCompleteServerComplete: String
    oneEvent: String
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello World!',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    dontResolve: () => new Promise(() => {}),
  },
  Subscription: {
    greetings:{
      subscribe: subscribe('greetings', {
        async onAfterSubscribe(_, __, { publish, complete }) {
          await publish({ topic: 'greetings', payload: { message: 'yoyo' } })
          await publish({ topic: 'greetings', payload: { message: 'hows it' } })
          await publish({ topic: 'greetings', payload: { message: 'howdy' } })
          await complete({ topic: 'greetings', payload: { message: 'wtf' } })
        },
      }),
      resolve: ({ payload }) => {
        return payload.message
      },
    },
    filterTest:{
      subscribe: subscribe('filterTest', {
        async filter() {
          return {
            error: false,
          }
        },
        async onAfterSubscribe(_, __, { publish, complete }) {
          await publish({ topic: 'filterTest', payload: { error: true, message: 'oh no!' } })
          await publish({ topic: 'filterTest', payload: { error: false, message: 'oh yes!' } })
          await publish({ topic: 'filterTest', payload: { message: 'Missing fields also work' } })
          await complete({ topic: 'filterTest' })
        },
      }),
      resolve({ payload }) {
        return payload.message
      },
    },
    onSubscribeError: {
      subscribe: subscribe('onSubscribeError', {
        async onSubscribe(_, __, { publish, complete }){
          await publish({ topic: 'sideChannel', payload: { message: 'onSubscribe' } })
          await complete({ topic: 'sideChannel' })
          return [new GraphQLError('onSubscribeError')]
        },
      }),
      resolve({ payload }) {
        return payload.message
      },
    },
    onCompleteTestClientDisconnect: {
      subscribe: subscribe('onCompleteTestClientDisconnect', {
        async onComplete(_, __, { publish, complete }){
          await publish({ topic: 'sideChannel', payload: { message: 'onComplete' } })
          await complete({ topic: 'sideChannel' })
        },
        async onAfterSubscribe(_, __, { publish }) {
          await publish({ topic: 'sideChannel', payload: { message: 'subscribed' } })
        },
      }),
      resolve({ payload }) {
        return payload.message
      },
    },
    onResolveError: {
      subscribe: subscribe('onResolveError', {
        async onComplete(_, __, { publish, complete }){
          await publish({ topic: 'sideChannel', payload: { message: 'onComplete' } })
          await complete({ topic: 'sideChannel' })
        },
        async onAfterSubscribe(_, __, { publish, complete }) {
          await publish({ topic: 'onResolveError', payload: { message: 'doesnt really matter does it' } })
          await complete({ topic: 'onResolveError' })
        },
      }),
      resolve() {
        throw new Error('resolver error')
      },
    },
    onCompleteServerComplete: {
      subscribe: subscribe('onCompleteServerComplete', {
        async onComplete(_, __, { publish, complete }){
          await publish({ topic: 'sideChannel', payload: { message: 'onComplete' } })
          await complete({ topic: 'sideChannel' })
        },
        async onAfterSubscribe(_, __, { publish, complete }) {
          await publish({ topic: 'sideChannel', payload: { message: 'subscribed' } })
          await complete({ topic: 'onCompleteServerComplete' })
        },
      }),
      resolve({ payload }) {
        return payload.message
      },
    },
    sideChannel: {
      subscribe: subscribe('sideChannel', {
        async onAfterSubscribe(_, __, { publish }) {
          await publish({ topic: 'sideChannel', payload: { message: 'start' } })
        },
      }),
      resolve({ payload }) {
        return payload.message
      },
    },
    oneEvent:{
      subscribe: subscribe('oneEvent', {
        async onAfterSubscribe(_, __, { publish }) {
          await publish({ topic: 'oneEvent', payload: { message: 'lets start!' } })
        },
      }),
      resolve: ({ payload }) => {
        return payload.message
      },
    },

  },
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const fetchTableNames = async () => {
  const tables = await arcTables()

  const ensureName = (table: string) => {
    const actualTableName = tables.name(table)
    if (!actualTableName) {
      throw new Error(`No table found for ${table}`)
    }
    return actualTableName
  }

  return {
    connections: ensureName('Connection'),
    subscriptions: ensureName('Subscription'),
  }
}

const subscriptionServer = makeServer({
  dynamodb: arcTables().then(tables => tables._db),
  schema,
  tableNames: fetchTableNames(),
  apiGatewayManagementApi: ws._api,
  onError: err => {
    console.log('onError', err.message)
  },
})

export { subscriptionServer }
