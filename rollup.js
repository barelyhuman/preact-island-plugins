const { generateIslands } = require('./lib/plugin')
const { writeFileSync, existsSync } = require('fs')
const { mkdir } = require('fs/promises')
const { dirname } = require('path')
const rollup = require('rollup')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { babel } = require('@rollup/plugin-babel')

exports = module.exports = rollupPlugin

const defaultOptions = {
  rootDir: '.',
  baseURL: '/public',
  atomic: true,
  hash: false,
  client: {
    output: './dist/client',
  },
}

/**
 * @param {import('../lib/types').Options} options
 * @returns
 */
function rollupPlugin(options = defaultOptions) {
  return {
    name: 'preact-island-plugin',
    async transform(_, id) {
      if (id.includes('virtual:')) return
      // ignore files that don't exist
      if (!existsSync(id)) return

      const { code, paths } = generateIslands(id, options)

      if (paths.client) {
        await mkdir(dirname(paths.client), { recursive: true })
        writeFileSync(paths.client, code.client, 'utf8')

        const builder = await rollup.rollup({
          input: paths.client,
          plugins: [
            nodeResolve(),
            babel({
              plugins: [
                [
                  '@babel/plugin-transform-react-jsx',
                  { runtime: 'automatic', importSource: 'preact' },
                ],
              ],
            }),
          ],
        })
        await builder.write({
          format: 'esm',
          dir: dirname(paths.client),
        })
      }

      return {
        code: code.server,
        map: null,
      }
    },
  }
}
