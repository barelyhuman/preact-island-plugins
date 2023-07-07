const { generateIslands } = require('./lib/plugin')
const { writeFileSync } = require('fs')
const { mkdir } = require('fs/promises')
const { dirname } = require('path')
const esbuild = require('esbuild')

exports = module.exports = esbuildPlugin

const defaultOptions = {
  rootDir: '.',
  baseURL: '/public',
  atomic: true,
  hash: true,
  client: {
    bundle: true,
    output: './dist/client',
  },
}

/**
 * @param {import('../lib/types').Options} options
 * @returns
 */
function esbuildPlugin(options = defaultOptions) {
  return {
    name: 'preact-island-plugin',
    async setup(build) {
      build.onLoad({ filter: /\.(js|ts)x?$/ }, async args => {
        const { code, paths } = generateIslands(args.path, options)

        if (options.client?.bundle && paths.client) {
          await mkdir(dirname(paths.client), { recursive: true })
          writeFileSync(paths.client, code.client, 'utf8')
          await esbuild.build({
            entryPoints: [paths.client],
            bundle: true,
            allowOverwrite: true,
            outfile: paths.client,
            platform: 'browser',
            jsx: 'automatic',
            jsxImportSource: 'preact',
            loader: {
              '.js': 'jsx',
            },
          })
        }

        return {
          contents: code.server,
          loader: 'jsx',
        }
      })
    },
  }
}
