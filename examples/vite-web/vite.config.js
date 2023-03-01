import preact from '@preact/preset-vite'
import preactIslandsPlugin from '../../dist/vite'

export default config => {
  return {
    build: {
      minify: false,
    },
    optimizeDeps: { extension: ['.jsx'] },
    plugins: [
      preactIslandsPlugin({
        atomic: false,
        cwd: __dirname,
      }),
      preact(),
    ],
  }
}
