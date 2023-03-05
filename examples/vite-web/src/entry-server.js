import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path, { resolve } from 'path'
import { h } from 'preact'
import { renderToString } from 'preact-render-to-string'
import HomePage from './components/HomePage'

const isProd = process.env.NODE_ENV === 'production'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const template = isProd
  ? fs.readFileSync(resolve(__dirname, '../client/index.html'), 'utf8')
  : fs.readFileSync(resolve(__dirname, '../index.html'), 'utf8')

export function setup(app, router, vite) {
  router.get('/', async (req, res) => {
    const appHTML = renderToString(h(HomePage))
    const html = template.replace(`<!--app-outlet-->`, appHTML)
    res.end(html)
    return
  })
}
