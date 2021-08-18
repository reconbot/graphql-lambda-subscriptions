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
      const { values } = await executeSubscription('subscription { greetings }')
      const greetings = await collect(map((value: { greetings: string }) => value.greetings, values))
      assert.deepEqual(greetings, ['yoyo', 'hows it', 'howdy'])
    })
  })

  describe('Filter Events', () => {
    it('subscribes', async () => {
      const { values } = await executeSubscription('subscription { filterTest }')
      const greetings = await collect(map((value: { filterTest: string }) => value.filterTest, values))
      assert.deepEqual(greetings, ['oh yes!', 'Missing fields also work'])
    })
  })
})
