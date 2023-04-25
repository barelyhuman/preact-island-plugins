import fs from 'fs/promises'
import path from 'path'
import { Options } from './lib/common'
import { sourceToIslands } from './lib/island'

import { defaultModifier, sourceDataToIslands } from './lib/island.js'
import { toHash } from './lib/to-hash.js'

export default function preactIslandPlugin({
  atomic = false,
  cwd = '.',
  baseURL = '',
  hash = false,
}: Options) {
  return {
    name: 'preact-island-plugin',
    async transform(_: any, id: string) {
      if (!/\.island\.jsx?$/.test(id)) {
        return null
      }

      const source = await fs.readFile(id, 'utf8')
      const hashedName = toHash(source)

      let nameModifier = defaultModifier

      if (hash) {
        nameModifier = (name: string) =>
          name.trim().replace(/.(js|ts)x?$/, `.client-${hashedName}.js`)
      }
      const { server, client } = await sourceDataToIslands(
        source,
        id,
        baseURL,
        {
          atomic,
          nameModifier,
        }
      )

      const genPath = await createGeneratedDir({ cwd })
      const fileName = path.basename(id).replace('.js', '.client.js')
      const fpath = path.join(genPath, fileName)

      // needs to be in `.generated/` for the client build to pick it up
      // can't use emitFile for this reason
      await fs.writeFile(fpath, client, 'utf8')

      return {
        code: server,
        map: null,
      }
    },
  }
}

async function createGeneratedDir({ cwd } = { cwd: '.' }) {
  const genPath = path.resolve(cwd, './.generated')
  await fs.mkdir(genPath, { recursive: true })
  return genPath
}
