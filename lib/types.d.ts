import type { TransformOptions } from 'esbuild'

export interface Options {
  rootDir: string
  baseURL: string
  atomic?: boolean
  hash?: boolean
  client: {
    output: string
  }
}

export type ESbuildOptions = Options & {
  esbuild?: TransformOptions
}
