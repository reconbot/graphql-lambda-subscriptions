/* eslint-disable @typescript-eslint/no-var-requires */
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { tables: arcTables } = require('@architect/functions')
const { createInstance, subscribe } = require('../../../dist')
const { ApiGatewayManagementApi } = require('aws-sdk')
const { GraphQLError } = require('graphql')

const makeManagementAPI = () => {
  const ARC_WSS_URL = process.env.ARC_WSS_URL
  const port = process.env.ARC_INTERNAL || '3332'

  if (process.env.NODE_ENV === 'testing') {
    return new ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: `http://localhost:${port}/_arc/ws`,
      region: process.env.AWS_REGION || 'us-west-2',
    })
  }
  return new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: `${ARC_WSS_URL.replace(/$ws/, 'http')}`,
  })
}

const typeDefs = `
  type Query {
    hello: String
  }
  type Subscription {
    greetings: String
    filterTest: String
    onSubscribeError: String
    sideChannel: String
    onCompleteTestClientDisconnect: String
    onResolveError: String
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
    apiGatewayManagementApi: makeManagementAPI(),
    onError: err => {
      console.log('onError', err.message)
      // throw err
    },
  })
  return server
}

module.exports = { buildSubscriptionServer }
