import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { Options } from './lib/common'

import { defaultModifier, sourceDataToIslands } from './lib/island.js'
import { toHash } from './lib/to-hash.js'

export default function preactIslandPlugin({
  atomic = false,
  rootDir = '.',
  baseURL = '',
  hash = false,
}: Options) {
  return {
    name: 'preact-island-plugin',
    async transform(_: any, id: string) {
      // Ignore virtual files since we don't need to handle then
      if (id.includes('virtual:')) return
      // ignore files that don't exist
      if (!existsSync(id)) return

      const source = await fs.readFile(id, 'utf8')
      let isIsland = false
      let commentIsland = false

      if (/\.island\.(jsx?|tsx?)?$/.test(id)) {
        isIsland = true
      } else {
        if (/\/\/[ ]*[@]{1}island?$/gim.test(source)) {
          isIsland = true
          commentIsland = true
        }
      }

      if (!isIsland) {
        return
      }

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

      const genPath = await createGeneratedDir({ cwd: rootDir })
      const fileName = path.basename(id).replace('.js', '.client.js')
      const normalizedName = nameModifier(fileName)
      const fpath = path.join(genPath, normalizedName)

      // needs to be in `.generated/` for the client build to pick it up
      // can't use emitFile for this reason
      await fs.writeFile(
        fpath,
        commentIsland ? '//@island\n' + client : client,
        'utf8'
      )

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
