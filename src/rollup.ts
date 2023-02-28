import fs from 'fs/promises'
import path from 'path'
import { Options } from './lib/common'
import { sourceToIslands } from './lib/island'

export default function preactIslandPlugin({
  atomic = false,
  cwd = '.',
  clientDir = '',
}: Options) {
  return {
    name: 'preact-island-plugin',
    async transform(code: string, id: string) {
      if (!/\.island\.js$/.test(id)) {
        return null
      }
      const ogFilePath = id
      const { server, client } = await sourceToIslands(ogFilePath, clientDir, {
        atomic: atomic || false,
      })

      const genPath = await createGeneratedDir({ cwd })
      const fileName = path.basename(ogFilePath).replace('.js', '.client.js')
      const fpath = path.join(genPath, fileName)

      // needs to be in `.generated/` for the client build to pick it up
      // can't use emitFile for this reason
      await fs.writeFile(fpath, client, 'utf8')

      return {
        code: server,
      }
    },
  }
}

async function createGeneratedDir({ cwd } = { cwd: '.' }) {
  const genPath = path.resolve(cwd, './.generated')
  await fs.mkdir(genPath, { recursive: true })
  return genPath
}
