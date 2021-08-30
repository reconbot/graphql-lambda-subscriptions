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
    'mocha-no-only',
  ],
  rules: {
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: { delimiter: 'none' },
      singleline: { delimiter: 'comma', requireLast: false },
      multilineDetection: 'last-member',
    }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/semi': ['error', 'never'],
    'array-bracket-spacing': ['error', 'never', { singleValue: false }],
    'comma-dangle': ['error', 'always-multiline'],
    'linebreak-style': ['error', 'unix'],
    'no-multi-spaces': ['error'],
    'no-param-reassign': 'error',
    'no-unused-vars': 'off',
    'object-curly-spacing': ['error', 'always'],
    'quote-props': ['error', 'as-needed'],
    'space-infix-ops': ['error'],
    "mocha-no-only/mocha-no-only": ["error"],
    indent: ['error', 2],
    quotes: ['error', 'single'],
    semi: 'off',
  },
}
