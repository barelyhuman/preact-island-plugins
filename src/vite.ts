import fs from 'fs/promises'
import path from 'path'
import { Options } from './lib/common'
import { sourceToIslands } from './lib/island'
import { transformWithEsbuild, Plugin } from 'vite'

import { defaultModifier, sourceDataToIslands } from './lib/island.js'
import { toHash } from './lib/to-hash.js'



export default function preactIslandPlugin(
  { atomic = false, cwd = '.', baseURL = '' ,hash}: Options = <Options>{}
): Plugin {
  return {
    name: 'preact-island-plugin',
    async transform(_: any, id: string) {
      if (!/\.island\.jsx$/.test(id)) {
        return null
      }

      
        const source = await fs.readFile(id, 'utf8')
        const hashedName = toHash(source)

        let nameModifier = defaultModifier

        if (hash) {
          nameModifier = (name: string) =>
            name.trim().replace(/.(js|ts)x?$/, `.client-${hashedName}.js`)
        }

      const { server, client } = await sourceToIslands(id, baseURL, {
        atomic,
	nameModifier,
      })

      const _client = tranformForVite(client)

      const genPath = await createGeneratedDir({ cwd })
      const fileName = path.basename(id).replace('.js', '.client.js')
      const fpath = path.join(genPath, fileName)

      // needs to be in `.generated/` for the client build to pick it up
      // can't use emitFile for this reason
      await fs.writeFile(fpath, _client, 'utf8')
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

function tranformForVite(code: string) {
  return code
    .replace(
      'hydrate(h(c.default, props), this)',
      'render(h(c.default, props), this,this)'
    )
    .replace(
      "import { h, hydrate } from 'preact'",
      "import { h, render } from 'preact'"
    )
}
