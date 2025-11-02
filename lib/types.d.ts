import type { TransformOptions } from 'esbuild'
import type { CompilerOptions, TypeAcquisition } from 'typescript'

export interface Options {
  rootDir: string
  baseURL: string
  atomic?: boolean
  hash?: boolean
  /**@deprecated client will be built based on your default `tsconfig.json` path*/
  tsconfig: string
  client: {
    replaceParentNode: boolean
    /**@deprecated client will be built based on your default `tsconfig.json` path*/
    tsconfig: string
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
