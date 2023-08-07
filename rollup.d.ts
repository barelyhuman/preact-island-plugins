import type { Options } from './lib/types'
export type { Options } from './lib/types'

/**
 * @param {import('../lib/types').Options} options
 * @returns
 */
declare function rollupPlugin(options?: Options): {
  name: string
  transform(
    _: any,
    id: any
  ): Promise<
    | {
        code: any
        map: null
      }
    | undefined
  >
}

export = rollupPlugin
