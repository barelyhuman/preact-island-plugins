const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { babel } = require('@rollup/plugin-babel')
const preactIslandPlugin = require('../../dist/rollup.cjs').default
const glob = require('tiny-glob')
const fs = require('fs').promises

module.exports = async function () {
  return [
    {
      input: 'server.js',
      output: {
        dir: 'dist',
        format: 'cjs',
      },
      plugins: [
        babel(),
        nodeResolve(),
        preactIslandPlugin({
          atomic: true,
          cwd: '.',
        }),
      ],
    },
    ...(await pipe(
      () =>
        glob('./**/*.client.js', {
          absolute: true,
          cwd: '.generated',
        }),
      files =>
        files.map(file => ({
          input: file,
          output: {
            dir: 'dist/js',
            format: 'esm',
          },
          plugins: [babel(), nodeResolve()],
        }))
    )),
  ]
}

function pipe(...args) {
  return args.reduce((acc, item, index) => {
    if (typeof item !== 'function')
      throw new Error(`[pipe] item at index: ${index} is not a function`)
    return acc.then(prev => {
      const res = item(prev)
      return Array.isArray(res) && res.every(x => x instanceof Promise)
        ? Promise.all(res)
        : res
    })
  }, Promise.resolve())
}
