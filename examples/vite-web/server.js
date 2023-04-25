import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createServer(isProd = process.env.NODE_ENV === 'production') {
  const app = express()

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'mpa',
  })

  try {
    const router = new express.Router()
    if (!isProd) {
      const { setup } = await vite.ssrLoadModule('/src/entry-server.js')
      setup(router, app, vite)
    } else {
      app.use(
        '/assets',
        (await import('serve-static')).default('dist/client/assets')
      )
      const setup = (await import('./dist/server/entry-server.js')).setup
      setup(router, app, vite)
    }

    app.use(router)
    router.use(vite.middlewares)
  } catch (e) {
    vite.ssrFixStacktrace(e)
    console.error(e)
  }

  app.listen(5173, () => {
    console.log('listening on 5173')
  })
}

createServer()
