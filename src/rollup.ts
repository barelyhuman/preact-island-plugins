import fs from 'fs/promises'
import path from 'path'
import { sourceToIslands } from './lib/island'

export default function preactIslandPlugin({ atomic = false, cwd = '.' }) {
  return {
    name: 'preact-island-plugin',
    async load(id: any) {
      if (!/\.island\.js$/.test(id)) {
        return null
      }

      const ogFilePath = id
      const { server, client } = await sourceToIslands(ogFilePath, {
        atomic: atomic || false,
      })

      const genPath = await createGeneratedDir({ cwd })
      const fileName = path.basename(ogFilePath).replace('.js', '.client.js')
      const fpath = path.join(genPath, fileName)

      // needs to be in `.generated/` for the client build to pick it up
      // can't use emitFile for this reason
      await fs.writeFile(fpath, client, 'utf8')

      return server
    },
  }
}

async function createGeneratedDir({ cwd } = { cwd: '.' }) {
  const genPath = path.resolve(cwd, './.generated')
  await fs.mkdir(genPath, { recursive: true })
  return genPath
}
