import type { TransformOptions } from 'esbuild'
import type { CompilerOptions, TypeAcquisition } from 'typescript'

export interface TSConfig {
  compilerOptions?: CompilerOptions
  exclude?: string[]
  compileOnSave?: boolean
  extends?: string
  files?: string[]
  include?: string[]
  typeAcquisition?: TypeAcquisition
}

export interface Options {
  rootDir: string
  baseURL: string
  atomic?: boolean
  hash?: boolean
  tsconfig: string | TSConfig
  client: {
    tsconfig?: string | TSConfig
    output: string
  }
}

export type ESbuildOptions = Options & {
  esbuild?: TransformOptions
}
