const { buildSubscriptionServer } = require('../../../lib/graphql')

const serverPromise = buildSubscriptionServer()

exports.handler = async function http () {
  // console.log('get /')
  const server = await serverPromise

  await server.publish({ topic: 'greetings', payload: 'hi' })
  await server.publish({ topic: 'greetings', payload: 'hey!' })
  await server.complete({ topic: 'greetings', payload: 'hi' })

  return {
    statusCode: 200,
    body: '',
  }
}
