import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let baseHTML
if (process.env.NODE_ENV === 'production') {
  baseHTML = fs.readFileSync(
    path.resolve(__dirname, './dist/client/index.html'),
    'utf-8'
  )
} else {
  baseHTML = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8')
}

async function createServer() {
  const app = express()
  const isProd = process.env.NODE_ENV === 'production'

  let vite

  const router = express.Router()

  let setup
  if (isProd) {
    const mod = await import('./dist/server/entry-server.js')
    setup = mod.setup
  } else {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })
    router.use(vite.middlewares)
    const mod = await vite.ssrLoadModule('./src/entry-server.js')
    setup = mod.setup
  }

  setup(router, vite, baseHTML)

  if (isProd) {
    router.use(
      (await import('serve-static')).default(path.resolve('dist/client'), {
        index: false,
      })
    )
  }

  app.use(router)

  app.listen(5173, () => {
    console.log('> Listening on 5173')
  })
}

createServer()
