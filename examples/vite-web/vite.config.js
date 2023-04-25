import preact from '@preact/preset-vite'
import preactIslandsPlugin from '../../dist/vite'

export default config => {
  return {
    build: {
      minify: false,
    },
    plugins: [
      preactIslandsPlugin({
        atomic: false,
        // baseURL: "./src",
        cwd: __dirname,
        // hash:true,
      }),
      preact(),
    ],
  }
}
