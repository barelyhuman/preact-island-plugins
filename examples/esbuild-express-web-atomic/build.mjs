import * as esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import fs from 'fs/promises'
import glob from 'tiny-glob'
import * as url from 'url'
import Watcher from 'watcher'
import preactIslandPlugin from '@barelyhuman/preact-island-plugins'

const atomic = true
const watch = process.argv.slice(2).includes('-w')

const commonConfig = {
  bundle: true,
  logLevel: 'info',
  jsx: 'automatic',
  loader: {
    '.js': 'jsx',
  },
  target: 'node14',
  format: 'esm',
  jsxImportSource: 'preact',
}

const server = () =>
  esbuild.build({
    ...commonConfig,
    platform: 'node',
    entryPoints: ['./server.js'],
    plugins: [
      nodeExternalsPlugin(),
      preactIslandPlugin.esbuild({
        baseURL: '/public/js',
        atomic: true,
        rootDir: url.fileURLToPath(new URL('.', import.meta.url)),
        bundleClient: {
          outdir: 'dist/js',
        },
      }),
    ],
    outfile: 'dist/server.js',
  })

async function main() {
  await server()
  // await generateManifest()
  // await client()
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
