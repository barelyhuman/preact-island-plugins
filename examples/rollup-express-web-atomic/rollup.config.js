const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { babel } = require('@rollup/plugin-babel')
const preactIslandPlugin = require('../../dist/rollup.cjs').default

function getServerConfig() {
  return {
    input: 'server.js',
    output: {
      dir: 'dist',
      format: 'cjs',
    },
    plugins: [
      nodeResolve(),
      preactIslandPlugin({
        baseURL: '/public/js',
        atomic: true,
        rootDir: '.',
        hash: true,
        bundleClient: {
          outDir: 'dist/js',
        },
      }),
      babel({
        babelHelpers: 'bundled',
      }),
    ],
  }
}

module.exports = async function () {
  return [getServerConfig()]
}
