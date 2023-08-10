const { existsSync } = require('fs')
const { readFile } = require('fs/promises')
const { resolve } = require('path')

exports.resolveTsConfig = resolveTsConfig

async function resolveTsConfig(config) {
  if (!config) {
    return {}
  }

  const validConfig = typeof config == 'object' || typeof config == 'string'

  if (!validConfig) {
    throw new Error(
      'expected `tsconfig` property to be either a path to the config or the raw tsconfig'
    )
  }

  // Expect it to be the path of the config
  if (typeof config == 'string') {
    if (existsSync(resolve(config))) {
      const configDef = await readFile(resolve(config), 'utf8')
      return JSON.parse(configDef)
    }
    return {}
  }

  return {
    ...config,
  }
}
