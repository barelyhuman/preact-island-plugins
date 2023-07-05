import * as esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import glob from 'tiny-glob'
import * as url from 'url'
import Watcher from 'watcher'
import islandPlugin from '@barelyhuman/preact-island-plugins/esbuild'

const preactIslandPlugin = islandPlugins.esbuild

const watch = process.argv.slice(2).includes('-w')

const commonConfig = {
  bundle: true,
  logLevel: 'info',
  jsx: 'automatic',
  loader: {
    '.js': 'jsx',
  },
  target: 'node14',
  format: 'cjs',
  jsxImportSource: 'preact',
}

const server = () =>
  esbuild.build({
    ...commonConfig,
    platform: 'node',
    entryPoints: ['./server.js'],
    plugins: [
      nodeExternalsPlugin(),
      preactIslandPlugin({
        baseURL: '/public/js',
        atomic: true,
        rootDir: url.fileURLToPath(new URL('.', import.meta.url)),
        bundleClient: {
          outDir: 'dist/js',
        },
      }),
    ],
    outfile: 'dist/server.js',
  })

async function main() {
  await server()
}

// if watching, watcher will execute an
// initial build
!watch && (await main())

if (watch) {
  const gPaths = await glob('./*.js', { absolute: true })
  const watcher = new Watcher(gPaths)
  watcher.on('error', error => {
    console.error(error)
  })

  watcher.on('close', () => {
    process.exit(0)
  })

  watcher.on('all', async () => {
    await main()
  })
}
