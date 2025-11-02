const { generateIslands, generateIslandsWithSource } = require('./lib/plugin')
const { writeFileSync, existsSync } = require('fs')
const { transform, build } = require('esbuild')
const { mkdir } = require('fs/promises')
const { dirname } = require('path')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const jsx = require('acorn-jsx')
const { babel } = require('@rollup/plugin-babel')
const { resolveTsConfig } = require('./lib/typescript')
const path = require('path')
const { ALLOWED_EXTENSIONS } = require('./lib/constants')
const { defu } = require('defu')

exports = module.exports = rollupPlugin

/**@type {import("../lib/types").Options} */
const defaultOptions = {
  rootDir: '.',
  baseURL: '/public',
  atomic: true,
  hash: false,
  client: {
    replaceParentNode: false,
    output: './dist/client',
  },
}

/**
 * @param {import('../lib/types').Options} options
 * @returns {import("rollup").Plugin}
 */
function rollupPlugin(options = defaultOptions) {
  options = defu(options, defaultOptions)
  return {
    name: 'preact-island-plugin',
    // vite specific option
    enforce: 'pre',
    async transform(sourceCode, id) {
      if (!ALLOWED_EXTENSIONS.includes(path.extname(id))) return
      if (id.includes('virtual:')) return
      // ignore files that don't exist
      if (!existsSync(id)) return

      const normalizedCode = await transform(sourceCode, {
        jsx: 'preserve',
        format: 'esm',
        platform: 'neutral',
        loader: 'tsx',
      })

      const generatedOutput = generateIslandsWithSource(
        normalizedCode.code,
        id,
        options
      )

      const { code, paths } = generatedOutput

      if (paths.client) {
        await mkdir(dirname(paths.client), { recursive: true })
        writeFileSync(paths.client, code.client, 'utf8')

        await build({
          entryPoints: [paths.client],
          platform: 'browser',
          allowOverwrite: true,
          bundle: true,
          jsx: 'automatic',
          jsxImportSource: 'preact',
          loader: {
            '.js': 'jsx',
          },
          format: 'esm',
          outdir: dirname(paths.client),
        })
      }

      const serverFinalTransform = await transform(code.server, {
        jsx: 'automatic',
        jsxImportSource: 'preact',
        loader: 'jsx',
      })

      return {
        code: serverFinalTransform.code,
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
