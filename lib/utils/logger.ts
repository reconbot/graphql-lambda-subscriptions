import debug from 'debug'

const logger = debug('graphql-lambda-subscriptions')

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
const log = (input: string, obj?: any): void => logger(input, obj)

export { log }
