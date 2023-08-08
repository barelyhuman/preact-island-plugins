const { generateIslands, generateIslandsWithSource } = require('./lib/plugin')
const { writeFileSync, existsSync } = require('fs')
const { mkdir } = require('fs/promises')
const { dirname } = require('path')
const rollup = require('rollup')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const jsx = require('acorn-jsx')
const { babel } = require('@rollup/plugin-babel')
const typescript = require('@rollup/plugin-typescript')

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
 * @returns {import("rollup").Plugin}
 */
function rollupPlugin(options = defaultOptions) {
  return {
    name: 'preact-island-plugin',
    async transform(_, id) {
      if (id.includes('virtual:')) return
      // ignore files that don't exist
      if (!existsSync(id)) return

      let generatedOutput

      if (id.endsWith('ts') || id.endsWith('tsx')) {
        const builder = await rollup.rollup({
          input: id,
          acornInjectPlugins: [jsx()],
          plugins: [
            typescript({
              jsx: 'preserve',
            }),
          ],
        })
        const build = await builder.generate({})
        const sourceCode = build.output[0].code
        generatedOutput = generateIslandsWithSource(sourceCode, id, options)
      } else {
        generatedOutput = generateIslands(id, options)
      }

      const { code, paths } = generatedOutput

      if (paths.client) {
        await mkdir(dirname(paths.client), { recursive: true })
        writeFileSync(paths.client, code.client, 'utf8')

        const builder = await rollup.rollup({
          input: paths.client,
          acornInjectPlugins: [jsx()],
          plugins: [
            typescript({
              jsx: 'react-jsx',
              jsxImportSource: 'preact',
            }),
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
