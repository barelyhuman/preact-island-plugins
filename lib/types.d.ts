export interface Options {
  rootDir: string;
  baseURL: string;
  atomic?: boolean;
  hash?: boolean;
  client: {
    bundle?: boolean
    output: string
  }
}
