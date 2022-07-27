import { start, end } from '@architect/sandbox'
import { join } from 'path'
import { mockServerContext } from '../test/mockServer'
import { complete } from './complete'

describe('pubsub:complete', () => {
  before(async () => {
    await start({ cwd: join(process.cwd(), './mocks/arc-basic-events'), quiet: true })
  })

  after(async () => {
    await end()
  })

  it('takes a topic', async () => {
    await complete(mockServerContext())({ topic: 'Topic12' })
  })
})
