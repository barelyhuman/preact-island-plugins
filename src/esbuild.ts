import fs from 'fs/promises'
import path from 'path'
import { sourceToIslands } from './lib/island.js'

export type Options = {
  cwd: string
  atomic?: boolean
}

export default function preactIslandPlugin({ cwd, atomic }: Options) {
  return {
    name: 'preact-island-plugin',
    async setup(build: any) {
      build.onLoad({ filter: /\.island\.js$/ }, async (args: any) => {
        const ogFilePath = args.path

        const { server, client } = await sourceToIslands(ogFilePath, {
          atomic: atomic || false,
        })

        const genPath = await createGeneratedDir({ cwd })
        const fileName = path.basename(ogFilePath)
        const fpath = path.join(genPath, fileName.replace('.js', '.client.js'))
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
