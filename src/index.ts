import esbuildPlugin from './esbuild'
import rollupPlugin from './rollup'
import vitePlugin from './vite'

const PreactPlugin = {
  esbuild: esbuildPlugin,
  rollup: rollupPlugin,
  vite: vitePlugin,
}

export default PreactPlugin
