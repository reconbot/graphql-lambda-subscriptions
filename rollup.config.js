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
  external: ['aws-sdk', '@aws/dynamodb-data-mapper', '@aws/dynamodb-data-mapper-annotations', '@aws/dynamodb-expressions', 'graphql', 'graphql-ws', 'graphql/execution/execute', 'tslib'],
}
