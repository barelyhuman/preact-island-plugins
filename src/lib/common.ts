export type Options = {
  rootDir: string
  baseURL: string
  atomic?: boolean
  hash?: boolean
  bundleClient?:
    | undefined
    | {
        outDir: string
      }
}
