import fs from 'fs/promises'
import path from 'path'
import { Plugin, transformWithEsbuild } from 'vite'
import { Options } from './lib/common'

import { defaultModifier, sourceDataToIslands } from './lib/island.js'
import { toHash } from './lib/to-hash.js'

export default function preactIslandPlugin(
  { atomic = false, cwd = '.', baseURL = '', hash }: Options = <Options>{}
): Plugin {
  return {
    name: 'preact-island-plugin',
    apply(config, { command }) {
      return Boolean(config.build?.ssr) || Boolean(command === 'serve')
    },
    config() {
      return {
        optimizeDeps: {
          include: ['preact/jsx-runtime'],
        },
      }
    },
    async transform(_: any, id: string) {
      const source = await fs.readFile(id, 'utf8')
      let isIsland = false
      let commentIsland = false

      if (/\.island\.(jsx?|tsx?)?$/.test(id)) {
        isIsland = true
      } else {
        if (/\/\/[ ]*[@]{1}island?$/gim.test(source)) {
          commentIsland = true
          isIsland = true
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

      const genPath = await createGeneratedDir({ cwd })
      const fileName = path.basename(id).replace('.js', '.client.js')
      const fpath = path.join(genPath, fileName)

      // needs to be in `.generated/` for the client build to pick it up
      // can't use emitFile for this reason
      await fs.writeFile(
        fpath,
        commentIsland ? '//@island\n' + client : client,
        'utf8'
      )

      const result = await transformWithEsbuild(server, id, {
        loader: 'jsx',
        jsx: 'automatic',
        jsxImportSource: 'preact',
      })

      return {
        ...result,
      }
    },
  }
}

async function createGeneratedDir({ cwd } = { cwd: '.' }) {
  const genPath = path.resolve(cwd, './.generated')
  await fs.mkdir(genPath, { recursive: true })
  return genPath
}
