module.exports = {
  out: './docs',
  readme: 'none',
  plugin: 'typedoc-plugin-markdown',
  excludeExternals: true,
  excludePrivate: true,
  excludeInternal: true,
  disableSources: true,
  categorizeByGroup: false, // removes redundant category names in matching modules
  exclude: ['**/*-test.ts'],
}
