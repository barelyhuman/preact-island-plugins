import { join, basename, dirname, resolve } from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import glob from 'fast-glob'

async function run() {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const files = await glob('*.cjs', {
    ignore: ['chunk-*'],
    absolute: true,
    cwd: resolve(rootDir, './dist'),
  })
  for (const file of files) {
    console.log(`>> Fix ${basename(file)}`)
    let code = await fs.readFile(file, 'utf8')
    code = code.replace('exports.default =', 'module.exports =')
    code += 'exports.default = module.exports;'
    await fs.writeFile(file, code)
  }

  await fs.copyFile(
    join(rootDir, 'package.json'),
    join(rootDir, './dist/package.json')
  )
  await fs.copyFile(
    join(rootDir, 'README.md'),
    join(rootDir, './dist/README.md')
  )
  await fs.copyFile(join(rootDir, 'LICENSE'), join(rootDir, './dist/LICENSE'))
}

run()
