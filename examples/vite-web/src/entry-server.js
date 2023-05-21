import { h } from 'preact'
import preactRenderToString from 'preact-render-to-string'
import routes from './routes.js'

export function setup(router, vite, baseHTML) {
  router.use((req, res, next) => {
    const url = req.originalUrl

    res.renderWithPreact = async (Component, props) => {
      try {
        let html = preactRenderToString(h(Component, { ...props }))
        let template = baseHTML
        template =
          (vite && (await vite.transformIndexHtml(url, template))) || template
        html = template.replace(`<!--ssr-outlet-->`, html)
        return res.status(200).set('Content-Type', 'text/html').end(html)
      } catch (err) {
        vite && vite.ssrFixStacktrace(err)
        console.error(e.stack)
        res.status(500).end(e.stack)
      }
    }
    next()
  })

  routes(router)
}
