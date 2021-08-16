/* eslint-disable @typescript-eslint/no-empty-function */
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

const ensureName = (tables: any, table: string) => {
  const actualTableName = tables.name(table)
  if (!actualTableName) {
    throw new Error(`No table found for ${table}`)
  }
  return actualTableName
}

export const mockServerArgs = async (args: Partial<ServerArgs> = {}): Promise<ServerArgs> => {
  const tables = await arcTables()

  return {
    dynamodb: arcTables.db,
    schema,
    tableNames: {
      connections: ensureName(tables, 'Connection'),
      subscriptions: ensureName(tables, 'Subscription'),
    },
    apiGatewayManagementApi: {
      postToConnection: () => ({ promise: async () => { } }),
      deleteConnection: () => ({ promise: async () => { } }),
    },
    onError: (err) => { console.log('onError'); throw err },
    ...args,
  }
}

export const mockServerContext = async (args?: Partial<ServerArgs>): Promise<ServerClosure> => {
  return makeServerClosure(await mockServerArgs(args))
}
