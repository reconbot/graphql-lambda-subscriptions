const { makeExecutableSchema } = require('@graphql-tools/schema')
const { tables: arcTables, ws } = require('@architect/functions')
const { createInstance, subscribe } = require('../../../dist')

const FakeApiGatewayManagementApi = {
  postToConnection({ ConnectionId: id, Data }) {
    return {
      async promise() {
        // console.log('postToConnection', { id, Data })
        const payload = JSON.parse(Data)
        await ws.send({ id, payload })
      },
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteConnection({ ConnectionId }) {
    return {
      async promise() {
        // console.log({ ConnectionId }, 'deleteConnection not implemented')
      },
    }
  },
}


const typeDefs = `
  type Query {
    hello: String
  }
  type Subscription {
    greetings: String
    filterTest: String
    onCompleteSideChannel: String
    onCompleteTestClientDisconnect: String
    onCompleteTestResolverError: String
    onCompleteServerComplete: String
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello World!',
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
    onCompleteTestClientDisconnect: {
      subscribe: subscribe('onCompleteTestResolverError', {
        async onComplete(_, __, { publish, complete }){
          await publish({ topic: 'onCompleteSideChannel', payload: { message: 'onComplete' } })
          await complete({ topic: 'onCompleteSideChannel' })
        },
        async onAfterSubscribe(_, __, { publish }) {
          await publish({ topic: 'onCompleteSideChannel', payload: { message: 'subscribed' } })
        },
      }),
      resolve({ payload }) {
        return payload.message
      },
    },
    onCompleteTestResolverError: {
      subscribe: subscribe('onCompleteTestResolverError', {
        async onComplete(_, __, { publish, complete }){
          await publish({ topic: 'onCompleteSideChannel', payload: { message: 'onComplete' } })
          await complete({ topic: 'onCompleteSideChannel' })
        },
        async onAfterSubscribe(_, __, { publish }) {
          await publish({ topic: 'onCompleteTestResolverError', payload: { message: 'doesnt really matter does it' } })
        },
      }),
      resolve() {
        throw new Error('oh no!')
      },
    },
    onCompleteServerComplete: {
      subscribe: subscribe('onCompleteServerComplete', {
        async onComplete(_, __, { publish, complete }){
          await publish({ topic: 'onCompleteSideChannel', payload: { message: 'onComplete' } })
          await complete({ topic: 'onCompleteSideChannel' })
        },
        async onAfterSubscribe(_, __, { publish, complete }) {
          await publish({ topic: 'onCompleteSideChannel', payload: { message: 'subscribed' } })
          await complete({ topic: 'onCompleteServerComplete' })
        },
      }),
      resolve({ payload }) {
        return payload.message
      },
    },
    onCompleteSideChannel: {
      subscribe: subscribe('onCompleteSideChannel', {
        async onAfterSubscribe(_, __, { publish }) {
          await publish({ topic: 'onCompleteSideChannel', payload: { message: 'start' } })
        },
      }),
      resolve({ payload }) {
        return payload.message
      },
    },
  },
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const buildSubscriptionServer = async () => {
  const tables = await arcTables()

  const ensureName = (table) => {
    const actualTableName = tables.name(table)
    if (!actualTableName) {
      throw new Error(`No table found for ${table}`)
    }
    return actualTableName
  }

  const server = createInstance({
    dynamodb: arcTables.db,
    schema,
    context: () => {
      return {
        publish: server.publish,
        complete: server.complete,
      }
    },
    tableNames: {
      connections: ensureName('Connection'),
      subscriptions: ensureName('Subscription'),
    },
    apiGatewayManagementApi: FakeApiGatewayManagementApi,
    onError: err => {
      console.log('onError', err)
      throw err
    },
  })
  return server
}

module.exports = { buildSubscriptionServer }
