const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { babel } = require('@rollup/plugin-babel')
const preactPlugin = require('@barelyhuman/preact-island-plugins/rollup')
const { DEFAULT_EXTENSIONS } = require('@babel/core')
const typescript = require('@rollup/plugin-typescript').default

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
    typescript({
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
      },
    }),
    preactPlugin(),
    babel({
      plugins: [
        [
          '@babel/plugin-transform-react-jsx',
          { runtime: 'automatic', importSource: 'preact' },
        ],
      ],
      babelHelpers: 'bundled',
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
    }),
  ],
}
