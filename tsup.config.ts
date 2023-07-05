import type { Options } from 'tsup'

export default <Options>{
  entryPoints: ['src/*.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  platform: 'node',
  external: ['path'],
  dts: true,
}
