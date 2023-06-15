import { createUnplugin } from 'unplugin'
import { Options } from './lib/common.js'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import esbuild from 'esbuild'

import { defaultModifier, sourceDataToIslands } from './lib/island.js'
import { toHash } from './lib/to-hash.js'

const preactIslandPlugin = createUnplugin(
  ({
    atomic = false,
    rootDir = '.',
    baseURL = '',
    hash = false,
    bundleClient,
  }: Options) => {
    return {
      name: 'preact-island-plugin',
      async transform(code: string, id: string) {
        // Ignore virtual files since we don't need to handle then
        if (id.includes('virtual:')) return
        // ignore files that don't exist
        if (!existsSync(id)) return

        if (
          bundleClient != null &&
          bundleClient != undefined &&
          code.indexOf('PREACT_CLIENT_ASSETS') > -1
        ) {
          const pathRel = path.relative(rootDir, bundleClient.outDir)
          code = code.replace('PREACT_CLIENT_ASSETS', `'${pathRel}'`)
          return {
            code: code,
            map: null,
          }
        }

        let isIsland = false
        let commentIsland = false

        if (/\.island\.(jsx?|tsx?)?$/.test(id)) {
          isIsland = true
        } else {
          if (/\/\/[ ]*[@]{1}island?$/gim.test(code)) {
            isIsland = true
            commentIsland = true
          }
        }

        if (!isIsland) {
          return
        }

        const hashedName = toHash(code)

        let nameModifier = defaultModifier

        if (hash) {
          nameModifier = (name: string) =>
            name.trim().replace(/.(js|ts)x?$/, `.client-${hashedName}.js`)
        }
        const { server, client } = await sourceDataToIslands(
          code,
          id,
          baseURL,
          {
            atomic,
            nameModifier,
          }
        )

        const genPath = await createGeneratedDir({ cwd: rootDir })
        const normalizedName = nameModifier(path.basename(id))
        const fpath = path.join(genPath, normalizedName)

        // needs to be in `.generated/` for the client build to pick it up
        // can't use emitFile for this reason
        await fs.writeFile(
          fpath,
          commentIsland ? '//@island\n' + client : client,
          'utf8'
        )

        if (bundleClient) {
          const output = fpath.replace(
            genPath,
            path.resolve(bundleClient.outDir)
          )
          await esbuild.build({
            entryPoints: [fpath],
            bundle: true,
            outfile: output,
            platform: 'browser',
            jsx: 'automatic',
            jsxImportSource: 'preact',
            loader: {
              '.js': 'jsx',
            },
          })
          await fs.rm(fpath)
        }

        return {
          code: server,
          map: null,
        }
      },
    }
  }
)

async function createGeneratedDir({ cwd } = { cwd: '.' }) {
  const genPath = path.resolve(cwd, './.generated')
  await fs.mkdir(genPath, { recursive: true })
  return genPath
}

export default preactIslandPlugin
