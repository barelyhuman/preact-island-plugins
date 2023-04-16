import fs from 'fs/promises'
import path from 'path'
import { Options } from './lib/common.js'
import { defaultModifier, sourceDataToIslands } from './lib/island.js'
import { toHash } from './lib/to-hash.js'

interface EsbuildOptions extends Options {
  hash?: boolean
}

export default function preactIslandPlugin({
  cwd,
  atomic,
  clientDir: clientDir,
  hash,
}: EsbuildOptions) {
  return {
    name: 'preact-island-plugin',
    async setup(build: any) {
      build.onLoad({ filter: /\.island\.(js|ts)x?$/ }, async (args: any) => {
        const ogFilePath = args.path

        const source = await fs.readFile(ogFilePath, 'utf8')
        const hashedName = toHash(source)

        let nameModifier = defaultModifier

        if (hash) {
          nameModifier = (name: string) =>
            name.trim().replace(/.(js|ts)x?$/, `.client-${hashedName}.js`)
        }

        const { server, client } = await sourceDataToIslands(
          source,
          ogFilePath,
          clientDir,
          {
            atomic: atomic || false,
            nameModifier,
          }
        )

        const genPath = await createGeneratedDir({ cwd })
        const fileName = path.basename(ogFilePath)

        const normalizedName = nameModifier(fileName)

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
