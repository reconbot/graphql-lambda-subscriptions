const { subscriptionServer } = require('../../../lib/graphql')

exports.handler = subscriptionServer.webSocketHandler
