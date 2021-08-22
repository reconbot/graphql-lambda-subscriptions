import { assert } from 'chai'
import { Handler } from 'aws-lambda'
import { tables } from '@architect/sandbox'
import { makeServer } from '.'
import { mockServerArgs } from './test/mockServer'
import { APIGatewayWebSocketEvent, WebSocketResponse } from './types'

describe('makeServer', () => {
  describe('webSocketHandler', () => {
    before(async () => {
      await tables.start({ cwd: './mocks/arc-basic-events', quiet: true })
    })

    after(async () => {
      await tables.end()
    })

    it('is type compatible with aws-lambda handler', async () => {
      const server = makeServer(await mockServerArgs())

      const webSocketHandler: Handler<APIGatewayWebSocketEvent, WebSocketResponse> = server.webSocketHandler
      assert.ok(webSocketHandler)
    })
  })
})
