const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { babel } = require('@rollup/plugin-babel')
const preactIslandPlugin = require('../../dist/rollup.cjs').default
const glob = require('tiny-glob')
const fs = require('fs').promises

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
        clientDir: 'dist/public/js',
        atomic: false,
        cwd: '.',
      }),
      babel(),
    ],
  }
}

function getClientConfig() {
  return pipe(
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
  )
}

module.exports = async function (args) {
  let c = Object.keys(args).find(key => key.startsWith('config-'))
  if (c) {
    c = c.slice('config-'.length).replace(/_/g, '/')
  } else {
    c = 'index'
  }
  return [
    (c === 'server' && getServerConfig()) || undefined,
    (c === 'client' && (await getClientConfig())) || undefined,
  ].filter(x => x)
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
