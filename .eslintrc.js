module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    indent: [ 'error', 2 ],
    'linebreak-style': [ 'error', 'unix' ],
    quotes: [ 'error', 'single' ],
    semi: 'off',
    '@typescript-eslint/semi': ['error', 'never'],
    'quote-props': ['error', 'as-needed'],
    'no-param-reassign': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'space-infix-ops': ['error'],
    'no-multi-spaces': ['error'],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: { delimiter: 'none' },
      singleline: { delimiter: 'comma', requireLast: false },
      multilineDetection: 'last-member',
    }],
  },
}
