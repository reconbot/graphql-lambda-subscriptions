/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai'
import { subscribe } from './subscribe'

describe('pubsub:subscribe', () => {
  it('is type compatible with it\'s callbacks', async () => {
    type GreetingEvent = {
      topic: 'greetings'
      payload: { message: 'hi!' }
    }

    type SubTopicType = (root: null, args: { id: string}, context: { db: boolean }, info: any) => AsyncGenerator<GreetingEvent, any, any>

    const foobar: SubTopicType = async function*() {
      yield {
        topic: 'greetings',
        payload: { message: 'hi!' },
      }
    }

    assert.ok(foobar)

    const subTopic: SubTopicType = subscribe('greetings', {
      onSubscribe(root, args, context) {
        if (root === null) {
          throw new Error('impossible')
        }
        args.id
        context.db
      },
      filter(root, args) {
        args.id
        return {
          message: 'hi!',
        }
      },
    })
    assert.ok(subTopic)
  })
})
