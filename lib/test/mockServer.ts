/* eslint-disable @typescript-eslint/no-empty-function */
import { makeExecutableSchema } from '@graphql-tools/schema'
import { tables as arcTables } from '@architect/functions'
import { buildServerClosure } from '../buildServerClosure'
import { ServerArgs, ServerClosure } from '../types'
import { subscribe } from '../pubsub/subscribe'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'


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
      resolve: ({ payload }) => {
        return payload
      },
    },
  },
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    dynamodb: tables._db as unknown as DynamoDBClient,
    schema,
    tableNames: {
      connections: ensureName(tables, 'Connection'),
      subscriptions: ensureName(tables, 'Subscription'),
    },
    apiGatewayManagementApi: {
      send: async () => ( async () => { } ),
    },
    onError: (err) => { console.log('onError'); throw err },
    ...args,
  }
}

export const mockServerContext = async (args?: Partial<ServerArgs>): Promise<ServerClosure> => {
  return buildServerClosure(await mockServerArgs(args))
}
