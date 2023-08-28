const { generateIslands, generateIslandsWithSource } = require('./lib/plugin')
const { writeFileSync, existsSync } = require('fs')
const { mkdir } = require('fs/promises')
const { dirname } = require('path')
const rollup = require('rollup')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const jsx = require('acorn-jsx')
const { babel } = require('@rollup/plugin-babel')
const { resolveTsConfig } = require('./lib/typescript')
const path = require('path')
const { ALLOWED_EXTENSIONS } = require('./lib/constants')

exports = module.exports = rollupPlugin

const defaultOptions = {
  rootDir: '.',
  baseURL: '/public',
  atomic: true,
  hash: false,
  tsconfig: './tsconfig.json',
  client: {
    tsconfig: './tsconfig.json',
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
      if (!ALLOWED_EXTENSIONS.includes(path.extname(id))) return
      if (id.includes('virtual:')) return
      // ignore files that don't exist
      if (!existsSync(id)) return

      let generatedOutput

      const typescript = autoLoadTypescriptPlug()

      if (id.endsWith('ts') || id.endsWith('tsx')) {
        let isIsland = false
        const baseTransformTSConfig = await resolveTsConfig(options.tsconfig)
        const builder = await rollup.rollup({
          input: id,
          acornInjectPlugins: [jsx()],
          plugins: [
            typescript({
              // Override given tsconfig's jsx property
              // for the client source since, it is the expected
              // input for the plugin
              // and modified by the plugin
              ...baseTransformTSConfig,
              compilerOptions: {
                ...baseTransformTSConfig.compilerOptions,
                jsx: 'preserve',
              },
            }),
          ],
        })
        const build = await builder.generate({})
        const sourceCode = build.output[0].code

        if (
          sourceCode.indexOf('//@island') > -1 ||
          sourceCode.indexOf('// @island') > -1
        ) {
          isIsland = true
        }

        let inputCode = sourceCode

        if (isIsland) {
          inputCode = '//@island\n' + inputCode
        }

        generatedOutput = generateIslandsWithSource(inputCode, id, options)
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
              ...(await resolveTsConfig(options.client.tsconfig)),
              jsx: 'preserve',
              jsxImportSource: 'preact',
            }),
            nodeResolve(),
            babel({
              babelHelpers: 'bundled',
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

// Creates a mock plugin if typescript
// doesn't exist and will just run an empty plugin instead
function autoLoadTypescriptPlug() {
  try {
    const plug = require('@rollup/plugin-typescript')
    if (plug) {
      return plug.default
    }
  } catch (err) {
    return () => ({
      name: 'typescript',
    })
  }
}
