import { assert } from 'chai'
import { start as sandBoxStart, end as sandBoxStop } from '@architect/sandbox'
import { collect, map } from 'streaming-iterables'
import { executeQuery, executeSubscription } from './execute-helper'

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
      const result = await executeQuery('{ hello }')
      assert.deepEqual(result, { hello: 'Hello World!' })
    })

    it('subscribes', async () => {
      const { values } = executeSubscription('subscription { greetings }')
      const greetings = await collect(map((value: { greetings: string }) => value.greetings, values))
      assert.deepEqual(greetings, ['yoyo', 'hows it', 'howdy'])
    })
  })

  describe('Filter Events', () => {
    it('subscribes', async () => {
      const { values } = executeSubscription('subscription { filterTest }')
      const greetings = await collect(map((value: { filterTest: string }) => value.filterTest, values))
      assert.deepEqual(greetings, ['oh yes!', 'Missing fields also work'])
    })
  })

  describe('onComplete', () => {
    it('fires when the client disconnects at least once', async () => {
      const { values } = executeSubscription('subscription { onCompleteSideChannel }')
      assert.deepEqual(await values.next(), { done: false, value: { onCompleteSideChannel: 'start' } })
      const { unsubscribe } = executeSubscription('subscription { onCompleteTestClientDisconnect }')
      assert.deepEqual(await values.next(), { done: false, value: { onCompleteSideChannel: 'subscribed' } })
      unsubscribe()
      assert.deepEqual((await collect(values))[0], { onCompleteSideChannel: 'onComplete' })
    })
    it('fires when the client completes', async () => {
      // non lazy connections don't disconnect when unsubscribed
      const { values, close } = executeSubscription('subscription { onCompleteSideChannel }', { lazy: false })
      assert.deepEqual(await values.next(), { done: false, value: { onCompleteSideChannel: 'start' } })
      const { unsubscribe } = executeSubscription('subscription { onCompleteTestClientDisconnect }')
      assert.deepEqual(await values.next(), { done: false, value: { onCompleteSideChannel: 'subscribed' } })
      unsubscribe()
      assert.deepEqual((await collect(values)), [{ onCompleteSideChannel: 'onComplete' }])
      await close()
    })
    // confirm behavior with graphql-ws but we don't currently error
    // it('fires when the resolver errors', async () => {
    //   const { values } = executeSubscription('subscription { onCompleteSideChannel }')
    //   assert.deepEqual(await values.next(), { done: false, value: { onCompleteSideChannel: 'start' } })
    //   const { values: errorValuesGen } = executeSubscription('subscription { onCompleteTestResolverError }')
    //   assert.deepEqual(await collect(errorValuesGen), [])
    //   assert.deepEqual(await collect(values), [{ onCompleteSideChannel: 'onComplete' }])
    // })
    it('fires when the server completes', async () => {
      const { values } = executeSubscription('subscription { onCompleteSideChannel }')
      assert.deepEqual(await values.next(), { done: false, value: { onCompleteSideChannel: 'start' } })
      const { values: completeValuesGen } = executeSubscription('subscription { onCompleteServerComplete }')
      assert.deepEqual(await collect(completeValuesGen), [])
      assert.deepEqual((await collect(values)), [
        { onCompleteSideChannel: 'subscribed' },
        { onCompleteSideChannel: 'onComplete' },
      ])
    })
  })
})
