const preactPlugin = require('@barelyhuman/preact-island-plugins/rollup')
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
        jsx: 'preserve',
      },
    }),
    preactPlugin(),
  ],
}
