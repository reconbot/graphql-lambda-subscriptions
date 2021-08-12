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
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello World!',
  },
  Subscription: {
    greetings:{
      subscribe: subscribe('greetings', {
        async onAfterSubscribe(_, __, {publish, complete}) {
          await publish({ topic: 'greetings', payload: 'yoyo' })
          await publish({ topic: 'greetings', payload: 'hows it' })
          await publish({ topic: 'greetings', payload: 'howdy' })
          await complete({ topic: 'greetings', payload: 'wtf' })
        },
      }),
      resolve: ({payload}) => {
        return payload
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
  })
  return server
}

module.exports = { buildSubscriptionServer }
