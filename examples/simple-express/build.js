const esbuild = require('esbuild')
const preactIslands = require('@barelyhuman/preact-island-plugins/esbuild')

esbuild
  .build({
    entryPoints: ['./src/app.tsx'],
    format: 'cjs',
    target: 'node16',
    platform: 'node',
    bundle: true,
    jsx: 'automatic',
    jsxImportSource: 'preact',
    loader: {
      '.js': 'jsx',
    },
    outdir: 'dist',
    plugins: [preactIslands()],
  })
  .then(_ => process.exit(0))
  .catch(_ => process.exit(1))
