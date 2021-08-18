import { assert } from 'chai'
import { Handler } from 'aws-lambda'
import { tables } from '@architect/sandbox'
import { createInstance } from '.'
import { mockServerArgs } from './test/mockServer'
import { APIGatewayWebSocketEvent, WebsocketResponse } from './types'

describe('createInstance', () => {
  describe('gatewayHandler', () => {
    before(async () => {
      await tables.start({ cwd: './mocks/arc-basic-events', quiet: true })
    })

    after(async () => {
      await tables.end()
    })

    it('is type compatible with aws-lambda handler', async () => {
      const server = createInstance(await mockServerArgs())

      const gatewayHandler: Handler<APIGatewayWebSocketEvent, WebsocketResponse> = server.gatewayHandler
      assert.ok(gatewayHandler)
    })
  })
})
