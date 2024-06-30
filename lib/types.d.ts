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
    replaceParentNode: boolean
    tsconfig?: string | TSConfig
    output: string
  }
}

export type ESbuildOptions = Options & {
  esbuild?: TransformOptions
} & {
  /**@deprecated the original options to esbuild will be inherited*/
  tsconfig: string | TSConfig
  client: {
    /**@deprecated the original options to esbuild will be inherited*/
    tsconfig?: string | TSConfig
  }
}

export type SimpleOmit = <T, Y extends keyof T>(
  obj: T,
  props: Y[]
) => Omit<T, Y>
