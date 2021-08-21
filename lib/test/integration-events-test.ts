import { assert, use } from 'chai'
import { start as sandBoxStart, end as sandBoxStop } from '@architect/sandbox'
import { collect, map } from 'streaming-iterables'
import { executeQuery, executeToComplete, executeToDisconnect } from './execute-helper'
import { startGqlWSServer } from './graphql-ws-schema'
import chaiSubset from 'chai-subset'

use(chaiSubset)

describe('Events', () => {
  before(async () => {
    await sandBoxStart({ cwd: './mocks/arc-basic-events', quiet: true })
  })

  after(async () => {
    await new Promise(resolve => setTimeout(resolve, 100)) // pending ddb writes need to finish
    await sandBoxStop()
  })
  describe('Basic Events', () => {
    it('queries', async () => {
      const { url, stop } = await startGqlWSServer()

      const lambdaResult = await collect(executeQuery('{ hello }'))
      const gqlWSResult = await collect(executeQuery('{ hello }', { url }))
      assert.deepEqual(lambdaResult, gqlWSResult)

      await stop()
    })

    it('subscribes', async () => {
      const { url, stop } = await startGqlWSServer()

      const lambdaResult = await collect(executeQuery('subscription { greetings }'))
      const gqlWSResult = await collect(executeQuery('subscription { greetings }', { url }))

      assert.deepEqual(lambdaResult, gqlWSResult)
      await stop()
    })

    it('errors on query validation failures', async () => {
      const { url, stop } = await startGqlWSServer()

      const lambdaResult = await collect(executeQuery('{ yo }'))
      const gqlWSResult = await collect(executeQuery('{ yo }', { url }))

      assert.deepEqual(lambdaResult, gqlWSResult)
      await stop()
    })

    it('errors when a resolver errors', async () => {
      const { url, stop } = await startGqlWSServer()

      const lambdaResult = await collect(executeQuery('subscription { onResolveError }'))
      const gqlWSResult = await collect(executeQuery('subscription { onResolveError }', { url }))

      assert.deepEqual(lambdaResult, gqlWSResult)
      await stop()
    })

    it('errors with validation errors', async () => {
      const { url, stop } = await startGqlWSServer()

      const lambdaResult = await collect(executeQuery('subscription { onSubscribeError }'))
      const gqlWSResult = await collect(executeQuery('subscription { onSubscribeError }', { url }))

      assert.deepEqual(lambdaResult, gqlWSResult)
      await stop()
    })
  })

  describe('Filter Events', () => {
    it('subscribes', async () => {
      const values = executeQuery('subscription { filterTest }')
      const greetings = await collect(map((value: any) => value.payload?.data?.filterTest ?? value.type, values))
      assert.deepEqual(greetings, ['oh yes!', 'Missing fields also work', 'complete'])
    })
  })

  describe('onSubscribe', () => {
    it('gets the right args')

    it('disconnects when it throws an error', async () => {
      const sideChannel = executeQuery('subscription { sideChannel }')
      assert.deepEqual((await sideChannel.next() as any).value.payload.data, { sideChannel: 'start' })
      const subscribeErrors = executeQuery('subscription { onSubscribeError }')
      assert.containSubset(await collect(subscribeErrors), [{ type: 'error', payload: [{ message: 'onSubscribeError' }] }])
      assert.containSubset(await collect(sideChannel), [
        { type: 'next', payload: { data: { sideChannel: 'onSubscribe' } } },
      ])
    })
  })

  describe('onComplete', () => {
    it('fires when the client disconnects at least once', async () => {
      const sideChannel = executeQuery('subscription { sideChannel }')
      assert.containSubset(await sideChannel.next(), { done: false, value: { type: 'next', payload: { data: { sideChannel: 'start' } } } })
      const disconnect = await executeToDisconnect('subscription { onCompleteTestClientDisconnect }')
      assert.containSubset(await sideChannel.next(), { done: false, value: { type: 'next', payload: { data: { sideChannel: 'subscribed' } } } })
      disconnect()
      assert.containSubset((await collect(sideChannel))[0], { type: 'next', payload: { data: { sideChannel: 'onComplete' } } })
    })
    it('fires when the client completes', async () => {
      // non lazy connections don't disconnect when unsubscribed
      const sideChannel = executeQuery('subscription { sideChannel }')
      assert.containSubset(await sideChannel.next(), { done: false, value: { type: 'next', payload: { data: { sideChannel: 'start' } } } })
      const unsubscribe = await executeToComplete('subscription { onCompleteTestClientDisconnect }')
      assert.containSubset(await sideChannel.next(), { done: false, value: { type: 'next', payload: { data: { sideChannel: 'subscribed' } } } })
      await unsubscribe()
      assert.containSubset((await collect(sideChannel)), [{ type: 'next', payload: { data: { sideChannel: 'onComplete' } } }, { type: 'complete' }])
    })
    it('fires when the resolver errors', async () => {
      const sideChannel = executeQuery('subscription { sideChannel }')
      assert.containSubset(await sideChannel.next(), { done: false, value: { type: 'next', payload: { data: { sideChannel: 'start' } } } })
      const errorValuesGen = executeQuery('subscription { onResolveError }')
      assert.containSubset(await collect(errorValuesGen), [
        { type: 'next', payload: { errors: [{ message: 'resolver error' }] } },
        { type: 'complete' },
      ])
      assert.containSubset(await collect(sideChannel), [
        { type: 'next', payload: { data: { sideChannel: 'onComplete' } } },
        { type: 'complete' },
      ])
    })
    it('fires when the server completes', async () => {
      const sideChannel = executeQuery('subscription { sideChannel }')
      assert.containSubset(await sideChannel.next(), { done: false, value: { type: 'next', payload: { data: { sideChannel: 'start' } } } })
      const values = executeQuery('subscription { onCompleteServerComplete }')
      assert.containSubset(await collect(values), [{ type:'complete' }])
      assert.containSubset((await collect(sideChannel)), [
        { type: 'next', payload: { data: { sideChannel: 'subscribed' } } },
        { type: 'next', payload: { data: { sideChannel: 'onComplete' } } },
        { type:'complete' },
      ])
    })
  })
})
