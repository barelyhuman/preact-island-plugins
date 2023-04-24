import fs from 'fs/promises'
import path from 'path'
import { Options } from './lib/common'
import { sourceToIslands } from './lib/island'

export default function preactIslandPlugin({
  atomic = false,
  cwd = '.',
  baseURL = '',
}: Options) {
  return {
    name: 'preact-island-plugin',
    async transform(_: any, id: string) {
      if (!/\.island\.jsx?$/.test(id)) {
        return null
      }

      const { server, client } = await sourceToIslands(id, baseURL, {
        atomic,
      })

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
