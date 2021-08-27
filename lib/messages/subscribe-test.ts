/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai'
import { tables } from '@architect/sandbox'
import { subscribe } from './subscribe'
import { mockServerContext } from '../test/mockServer'
import { connection_init } from './connection_init'
import { collect } from 'streaming-iterables'
import { subscribe as pubsubSubscribe } from '../pubsub/subscribe'
import { makeExecutableSchema } from '@graphql-tools/schema'

const connectionId = '7rWmyMbMr'
const ConnectionId = connectionId
const connectionInitEvent: any = { requestContext: { connectedAt: 1628905962601, connectionId, domainName: 'localhost:6001', eventType: 'MESSAGE', messageDirection: 'IN', messageId: 'Pn6evkpk2', requestId: 'gN1MPybyL', requestTimeEpoch: 1628905962602, routeKey: '$default', stage: 'testing' }, isBase64Encoded: false, body: '{"type":"connection_init"}' }

describe('messages/subscribe', () => {
  beforeEach(async () => {
    await tables.start({ cwd: './mocks/arc-basic-events', quiet: true })
  })

  afterEach(async () => {
    await tables.end()
  })

  it('executes a query/mutation', async () => {
    const event: any = { requestContext: { connectedAt: 1628889982819, connectionId, domainName: 'localhost:3339', eventType: 'MESSAGE', messageDirection: 'IN', messageId: 'b6o5BPxb3', requestId: 'MaEe0DVon', requestTimeEpoch: 1628889983319, routeKey: '$default', stage: 'testing' }, isBase64Encoded: false, body: '{"id":"abcdefg","type":"subscribe","payload":{"query":"{ hello }"}}' }
    const state: { delete: { ConnectionId: string }[], post: { ConnectionId: string, Data: string }[] } = { post: [], delete: [] }
    const server = await mockServerContext({
      apiGatewayManagementApi: {
        postToConnection: (input) => ({ promise: async () => { state.post.push(input) } }),
        deleteConnection: (input) => ({ promise: async () => { state.delete.push(input) } }),
      },
    })
    await connection_init({ server, event: connectionInitEvent, message: JSON.parse(connectionInitEvent.body) })
    await subscribe({ server, event, message: JSON.parse(event.body) })
    assert.deepEqual(state, {
      post: [
        { ConnectionId, Data: JSON.stringify({ type: 'connection_ack' }) },
        { ConnectionId, Data: JSON.stringify({ type: 'next', id: 'abcdefg', payload: { data: { hello: 'Hello World!' } } }) },
        { ConnectionId, Data: JSON.stringify({ type: 'complete', id: 'abcdefg' }) },
      ],
      delete: [],
    })
  })

  it('records a subscription', async () => {
    const event: any = { requestContext: { connectedAt: 1628889984369, connectionId, domainName: 'localhost:3339', eventType: 'MESSAGE', messageDirection: 'IN', messageId: 'el4MNdOJy', requestId: '0yd7bkvXz', requestTimeEpoch: 1628889984774, routeKey: '$default', stage: 'testing' }, isBase64Encoded: false, body: '{"id":"1234","type":"subscribe","payload":{"query":"subscription { greetings }"}}' }
    const state: { delete: { ConnectionId: string }[], post: { ConnectionId: string, Data: string }[] } = { post: [], delete: [] }
    const server = await mockServerContext({
      apiGatewayManagementApi: {
        postToConnection: (input) => ({ promise: async () => { state.post.push(input) } }),
        deleteConnection: (input) => ({ promise: async () => { state.delete.push(input) } }),
      },
    })
    await connection_init({ server, event: connectionInitEvent, message: JSON.parse(connectionInitEvent.body) })
    await subscribe({ server, event, message: JSON.parse(event.body) })
    assert.deepEqual(state, {
      post: [
        { ConnectionId, Data: JSON.stringify({ type: 'connection_ack' }) },
      ],
      delete: [],
    })

    const [subscriptions] = await collect(server.models.subscription.query({
      IndexName: 'ConnectionIndex',
      ExpressionAttributeNames: { '#a': 'connectionId' },
      ExpressionAttributeValues: { ':1': event.requestContext.connectionId },
      KeyConditionExpression: '#a = :1',
    }))
    assert.containSubset(subscriptions, { connectionId, subscriptionId: '1234' })
  })

  it('sends errors on error', async () => {
    const event: any = { requestContext: { connectedAt: 1628889982819, connectionId, domainName: 'localhost:3339', eventType: 'MESSAGE', messageDirection: 'IN', messageId: 'b6o5BPxb3', requestId: 'MaEe0DVon', requestTimeEpoch: 1628889983319, routeKey: '$default', stage: 'testing' }, isBase64Encoded: false, body: '{"id":"abcdefg","type":"subscribe","payload":{"query":"{ HIHOWEAREYOU }"}}' }
    const state: { delete: { ConnectionId: string }[], post: { ConnectionId: string, Data: string }[] } = { post: [], delete: [] }
    const server = await mockServerContext({
      apiGatewayManagementApi: {
        postToConnection: (input) => ({ promise: async () => { state.post.push(input) } }),
        deleteConnection: (input) => ({ promise: async () => { state.delete.push(input) } }),
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onError: undefined,
    })
    await connection_init({ server, event: connectionInitEvent, message: JSON.parse(connectionInitEvent.body) })
    await subscribe({ server, event, message: JSON.parse(event.body) })
    assert.deepEqual(state, {
      post: [
        { ConnectionId, Data: JSON.stringify({ type: 'connection_ack' }) },
        { ConnectionId, Data: JSON.stringify({ type: 'error', id: 'abcdefg', payload: [{
          message: 'Cannot query field "HIHOWEAREYOU" on type "Query".',
          locations: [{ line:1, column:3 }],
        },
        ] }) },
      ],
      delete: [],
    })
  })

  it('calls the global error callback server errors', async () => {
    const event: any = { requestContext: { connectedAt: 1628889982819, connectionId, domainName: 'localhost:3339', eventType: 'MESSAGE', messageDirection: 'IN', messageId: 'b6o5BPxb3', requestId: 'MaEe0DVon', requestTimeEpoch: 1628889983319, routeKey: '$default', stage: 'testing' }, isBase64Encoded: false, body: '{"id":"abcdefg","type":"subscribe","payload":{"query":"{ hello }"}}' }
    let error: any = null
    let sendErr = false
    const server = await mockServerContext({
      apiGatewayManagementApi: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        postToConnection: () => ({ promise: async () => { if(sendErr) { throw new Error('postToConnection Error') } } }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        deleteConnection: () => ({ promise: async () => { } }),
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onError: err => (error = err),
    })
    await connection_init({ server, event: connectionInitEvent, message: JSON.parse(connectionInitEvent.body) })
    sendErr = true
    await subscribe({ server, event, message: JSON.parse(event.body) })
    assert.match(error.message, /postToConnection Error/ )
  })

  describe('callbacks', () => {
    it('fires onSubscribe before subscribing', async () => {
      const onSubscribe: string[] = []

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
            subscribe: pubsubSubscribe('greetings', {
              onSubscribe() {
                onSubscribe.push('We did it!')
                throw new Error('don\'t subscribe!')
              },
            }),
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
      const server = await mockServerContext({
        schema,
      })
      const event: any = { requestContext: { connectedAt: 1628889984369, connectionId, domainName: 'localhost:3339', eventType: 'MESSAGE', messageDirection: 'IN', messageId: 'el4MNdOJy', requestId: '0yd7bkvXz', requestTimeEpoch: 1628889984774, routeKey: '$default', stage: 'testing' }, isBase64Encoded: false, body: '{"id":"1234","type":"subscribe","payload":{"query":"subscription { greetings }"}}' }

      await connection_init({ server, event: connectionInitEvent, message: JSON.parse(connectionInitEvent.body) })
      try {
        await subscribe({ server, event, message: JSON.parse(event.body) })
        throw new Error('should not have subscribed')
      } catch (error) {
        assert.equal(error.message, 'don\'t subscribe!')
      }
      assert.deepEqual(onSubscribe, ['We did it!'])
      const subscriptions = await collect(server.models.subscription.query({
        IndexName: 'ConnectionIndex',
        ExpressionAttributeNames: { '#a': 'connectionId' },
        ExpressionAttributeValues: { ':1': event.requestContext.connectionId },
        KeyConditionExpression: '#a = :1',
      }))
      assert.isEmpty(subscriptions)
    })

    it('fires onAfterSubscribe after subscribing', async () => {
      const events: string[] = []

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
            subscribe: pubsubSubscribe('greetings', {
              onSubscribe() {
                events.push('onSubscribe')
              },
              onAfterSubscribe() {
                events.push('onAfterSubscribe')
              },
            }),
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
      const server = await mockServerContext({
        schema,
      })
      const event: any = { requestContext: { connectedAt: 1628889984369, connectionId, domainName: 'localhost:3339', eventType: 'MESSAGE', messageDirection: 'IN', messageId: 'el4MNdOJy', requestId: '0yd7bkvXz', requestTimeEpoch: 1628889984774, routeKey: '$default', stage: 'testing' }, isBase64Encoded: false, body: '{"id":"1234","type":"subscribe","payload":{"query":"subscription { greetings }"}}' }

      await connection_init({ server, event: connectionInitEvent, message: JSON.parse(connectionInitEvent.body) })
      await subscribe({ server, event, message: JSON.parse(event.body) })
      assert.deepEqual(events, ['onSubscribe', 'onAfterSubscribe'])
      const subscriptions = await collect(server.models.subscription.query({
        IndexName: 'ConnectionIndex',
        ExpressionAttributeNames: { '#a': 'connectionId' },
        ExpressionAttributeValues: { ':1': event.requestContext.connectionId },
        KeyConditionExpression: '#a = :1',
      }))
      assert.isNotEmpty(subscriptions)
    })
  })
})
