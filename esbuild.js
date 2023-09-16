const { generateIslands, generateIslandsWithSource } = require('./lib/plugin')
const { writeFileSync } = require('fs')
const { mkdir, readFile } = require('fs/promises')
const { dirname } = require('path')
const esbuild = require('esbuild')
const { resolveTsConfig } = require('./lib/typescript')
const { defu } = require('defu')

exports = module.exports = esbuildPlugin

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
 * @param {import('../lib/types').ESbuildOptions} options
 * @returns
 */
function esbuildPlugin(options = defaultOptions) {
  options = defu(options, defaultOptions)

  return {
    name: 'preact-island-plugin',
    async setup(build) {
      build.onLoad({ filter: /\.(js|ts)x?$/ }, async args => {
        let generatorOutput

        if (args.path.endsWith('.ts') || args.path.endsWith('.tsx')) {
          let isIsland = false
          const sourceCode = await readFile(args.path, 'utf8')

          if (
            sourceCode.indexOf('//@island') > -1 ||
            sourceCode.indexOf('// @island') > -1
          ) {
            isIsland = true
          }

          const esbuildTransformOptions = Object.assign(
            {},
            (options && options.esbuild) || {}
          )

          const jsCode = await esbuild.transform(sourceCode, {
            loader: 'tsx',
            platform: 'node',
            target: 'node16',
            jsx: 'preserve',
            tsconfigRaw: {
              ...(await resolveTsConfig(options.tsconfig)),
            },
            ...esbuildTransformOptions,
          })

          let inputCode = jsCode.code

          if (isIsland) {
            inputCode = '//@island\n' + inputCode
          }

          generatorOutput = generateIslandsWithSource(
            inputCode,
            args.path,
            options
          )
        } else {
          generatorOutput = generateIslands(args.path, options)
        }

        const { code, paths } = generatorOutput

        if (paths.client) {
          await mkdir(dirname(paths.client), { recursive: true })
          writeFileSync(paths.client, code.client, 'utf8')
          await esbuild.build({
            entryPoints: [paths.client],
            bundle: true,
            allowOverwrite: true,
            outfile: paths.client,
            tsconfigRaw: {
              ...(await resolveTsConfig(
                options.client && options.client.tsconfig
              )),
            },
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
