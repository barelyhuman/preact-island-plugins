const { generateIslands, generateIslandsWithSource } = require('./lib/plugin')
const { writeFileSync } = require('fs')
const { mkdir, readFile } = require('fs/promises')
const { dirname } = require('path')
const { resolveTsConfig } = require('./lib/typescript')
const { defu } = require('defu')
const { simpleOmit } = require('./lib/omit')

exports = module.exports = esbuildPlugin

/**@type {import("./lib/types").ESbuildOptions} */
const defaultOptions = {
  rootDir: '.',
  baseURL: '/public',
  atomic: true,
  hash: false,
  client: {
    output: './dist/client',
    replaceParentNode: false,
  },
}

/**
 * @param {import('./lib/types.d.ts').ESbuildOptions} options
 * @returns {import("esbuild").Plugin}
 */
function esbuildPlugin(options = defaultOptions) {
  options = defu(options, defaultOptions)

  if (options.client?.tsconfig || options.tsconfig) {
    throw new Error(
      '[preact-island-plugin] tsconfig/client.tsconfig is no longer taken from the plugin config and is instead picked from the original esbuild configuration'
    )
  }

  return {
    name: 'preact-island-plugin',
    async setup(build) {
      const esbuild = build.esbuild
      const userTsConfig = build.initialOptions.tsconfig
      const userTsConfigRaw = build.initialOptions.tsconfigRaw
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

          const esbuildTransformOptions = simpleOmit(
            Object.assign({}, (options && options.esbuild) || {}),
            ['loader', 'jsx']
          )

          const jsCode = await esbuild.transform(sourceCode, {
            loader: 'tsx',
            platform: 'node',
            target: 'node16',
            jsx: 'preserve',
            tsconfigRaw: {
              ...userTsConfigRaw,
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
            tsconfig: userTsConfig,
            tsconfigRaw: {
              ...userTsConfigRaw,
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
