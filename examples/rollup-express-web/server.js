import preactRenderToString from 'preact-render-to-string'
import HomePage from './HomePage.js'

const withManifestBundles = ({ body }) => {
  return `<html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        html {
          font-family: sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      </style>
    </head>

    <body>
      ${body}
    </body>
    <script
      type="module"
      src="/public/js/client.js"
    ></script>
  </html>`
}

const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.status(200).write(
    withManifestBundles({
      body: preactRenderToString(<HomePage />),
    })
  )
  res.end()
})

app.use('/public', express.static('./dist', { maxAge: 60 * 60 * 1000 }))

app.listen(port, () => console.log(`listening at http://localhost:${port}`))
