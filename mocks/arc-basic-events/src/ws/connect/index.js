const { buildSubscriptionServer } = require('../../../lib/graphql')

const serverPromise = buildSubscriptionServer()

exports.handler = async function connect (event) {
  // console.log('connect')
  const server = await serverPromise
  return server.gatewayHandler(event)
}
