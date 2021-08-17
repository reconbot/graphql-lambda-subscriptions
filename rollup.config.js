import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './dist-ts/index.js',
  plugins: [
    resolve({}),
  ],
  output: [
    { format: 'esm', file: './dist/index-esm.mjs' },
    { format: 'cjs', file: './dist/index.js' },
  ],
  external: [
    // peer deps
    'aws-sdk',
    'graphql',
    'graphql/execution/execute',
    // actual deps
    '@aws/dynamodb-data-mapper',
    '@aws/dynamodb-data-mapper-annotations',
    '@aws/dynamodb-expressions',
    // dep from ts while we're using these decorator stuff, want to include it
    // 'tslib',
    // we only use a string and types from this package so lets import it
    // 'graphql-ws',
  ],
}