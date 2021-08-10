const { buildSubscriptionServer } = require('../../../lib/graphql')

const serverPromise = buildSubscriptionServer()

exports.handler = async function ws (event) {
  // console.log('disconnect')
  const server = await serverPromise
  return server.gatewayHandler(event)
}
