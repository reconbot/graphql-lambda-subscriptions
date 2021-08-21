import { tables } from '@architect/sandbox'
import { mockServerContext } from '../test/mockServer'
import { complete } from './complete'

describe('pubsub:complete', () => {
  before(async () => {
    await tables.start({ cwd: './mocks/arc-basic-events', quiet: true })
  })

  after(async () => {
    await tables.end()
  })

  it('takes a topic', async () => {
    await complete(mockServerContext())({ topic: 'Topic12' })
  })
})
