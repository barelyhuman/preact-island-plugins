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
          atomic: false,
          cwd: '.',
        }),
      ],
    },
    await pipe(
      () =>
        glob('./**/*.client.js', {
          absolute: false,
          cwd: '.generated',
        }),
      files => files.map(x => `import "./${x}";`).join('\n'),
      imports => fs.writeFile('./.generated/client.js', imports, 'utf8'),
      () => ({
        input: './.generated/client.js',
        output: {
          dir: 'dist/js',
          format: 'esm',
        },
        plugins: [babel(), nodeResolve()],
      })
    ),
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
