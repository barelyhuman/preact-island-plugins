import fs from 'fs/promises'
import path from 'path'
import { Options } from './lib/common'
import { sourceToIslands } from './lib/island'
import { transformWithEsbuild, Plugin } from 'vite'

import { defaultModifier, sourceDataToIslands } from './lib/island.js'
import { toHash } from './lib/to-hash.js'

export default function preactIslandPlugin(
  { atomic = false, cwd = '.', baseURL = '', hash }: Options = <Options>{}
): Plugin {
  return {
    name: 'preact-island-plugin',
    async transform(_: any, id: string) {
      if (!/\.island\.(jsx?|tsx?)?$/.test(id)) {
        return null
      }

      console.log('came here')
      const source = await fs.readFile(id, 'utf8')
      const hashedName = toHash(source)

      console.log('came here 1')
      let nameModifier = defaultModifier

      if (hash) {
        nameModifier = (name: string) =>
          name.trim().replace(/.(js|ts)x?$/, `.client-${hashedName}.js`)
      }

      console.log('came here 3')

      const { server, client } = await sourceDataToIslands(
        source,
        id,
        baseURL,
        {
          atomic,
          nameModifier,
        }
      )

      console.log('came here 4')
      const _client = tranformForVite(client)

      console.log('came here 5')
      const genPath = await createGeneratedDir({ cwd })
      const fileName = path.basename(id).replace('.js', '.client.js')
      const fpath = path.join(genPath, fileName)

      console.log('came here 6')
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
      'hydrate(restoreTree(c.default, props, props.children || []), this)',
      'render(restoreTree(c.default, props, props.children || []), this, this)'
    )
    .replace(
      "import { h, hydrate } from 'preact'",
      "import { h, render } from 'preact'"
    )
}
