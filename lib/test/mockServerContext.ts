import { makeExecutableSchema } from '@graphql-tools/schema'
import { tables as arcTables } from '@architect/functions'
import { makeServerClosure } from '../makeServerClosure'
import { ServerArgs, ServerClosure } from '../types'
import { subscribe } from '../pubsub/subscribe'


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
      subscribe: subscribe('greetings'),
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


export const mockServerContext = async (args: Partial<ServerArgs>): Promise<ServerClosure> => {
  const tables = await arcTables()

  const ensureName = (table) => {
    const actualTableName = tables.name(table)
    if (!actualTableName) {
      throw new Error(`No table found for ${table}`)
    }
    return actualTableName
  }

  return makeServerClosure({
    dynamodb: arcTables.db,
    schema,
    tableNames: {
      connections: ensureName('Connection'),
      subscriptions: ensureName('Subscription'),
    },
    onError: (err) => { console.log('onError'); throw err },
    ...args,
  })
}
