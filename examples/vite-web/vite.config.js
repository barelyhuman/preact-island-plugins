import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import preactIslandVite from '@barelyhuman/preact-island-plugins/vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
  },
  plugins: [
    preact(),
    preactIslandVite({
      atomic: false,
      hash: false,
    }),
  ],
})
