import debug from 'debug'

const logger = debug('graphql-lambda-subscriptions')

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
const log = (message: string, obj?: any): void => logger(message, obj)

export { log }
