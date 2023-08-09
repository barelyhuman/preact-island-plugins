import type { ESbuildOptions } from './lib/types'
export type { ESbuildOptions } from './lib/types'

/**
 * @param {import('../lib/types').ESbuildOptions} options
 * @returns
 */
declare function esbuildPlugin(options?: ESbuildOptions): {
  name: string
  setup(build: any): Promise<void>
}

export = esbuildPlugin
