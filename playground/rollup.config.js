const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { babel } = require('@rollup/plugin-babel')
const preactPlugin = require('../rollup')

/**
 * @type {import("rollup").RollupOptions}
 */
module.exports = {
  input: 'server.js',
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  plugins: [
    preactPlugin(),
    babel({
      plugins: [
        [
          '@babel/plugin-transform-react-jsx',
          { runtime: 'automatic', importSource: 'preact' },
        ],
      ],
      babelHelpers: 'bundled',
    }),
  ],
}
