import { assert } from 'chai'
import { APIGatewayProxyWebsocketEventV2, Handler } from 'aws-lambda'
import { start, end } from '@architect/sandbox'
import { makeServer } from '.'
import { mockServerArgs } from './test/mockServer'
import { WebSocketResponse } from './types'
import { join } from 'path'

describe('makeServer', () => {
  describe('webSocketHandler', () => {
    before(async () => {
      await start({ cwd: join(process.cwd(),'./mocks/arc-basic-events'), quiet: true })
    })

    after(async () => {
      await end()
    })

    it('is type compatible with aws-lambda handler', async () => {
      const server = makeServer(await mockServerArgs())

      const webSocketHandler: Handler<APIGatewayProxyWebsocketEventV2, WebSocketResponse> = server.webSocketHandler
      assert.ok(webSocketHandler)
    })
  })
})
