import type { Options } from './lib/types'
export type { Options } from './lib/types'

/**
 * @param {import('../lib/types').Options} options
 * @returns
 */
declare function esbuildPlugin(options?: Options): {
  name: string
  setup(build: any): Promise<void>
}

export = esbuildPlugin