import fs from 'fs/promises'
import path from 'path'
import { Options } from './lib/common.js'
import { sourceToIslands } from './lib/island.js'

export default function preactIslandPlugin({
  cwd,
  atomic,
  clientDir: clientDir,
}: Options) {
  return {
    name: 'preact-island-plugin',
    async setup(build: any) {
      build.onLoad({ filter: /\.island\.(js|ts)x?$/ }, async (args: any) => {
        const ogFilePath = args.path

        const { server, client } = await sourceToIslands(
          ogFilePath,
          clientDir,
          {
            atomic: atomic || false,
          }
        )

        const genPath = await createGeneratedDir({ cwd })
        const fileName = path.basename(ogFilePath)

        const normalizedName = fileName.replace(/\.(ts|js)x?$/, '.client.js')

        const fpath = path.join(genPath, normalizedName)
        await fs.writeFile(fpath, client, 'utf8')

        return {
          contents: server,
          loader: 'jsx',
        }
      })
    },
  }
}

async function createGeneratedDir({ cwd } = { cwd: '.' }) {
  const genPath = path.resolve(cwd, './.generated')
  await fs.mkdir(genPath, { recursive: true })
  return genPath
}
