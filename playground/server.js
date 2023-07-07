import express from 'express'
import comToString from 'preact-render-to-string'
import Counter from './Counter'
import serveStatic from 'serve-static'
import { join } from 'path'

const app = express()

app.use('/public', serveStatic(join(__dirname, './client')))

app.get('/', (req, res) => {
  return res.send(comToString(<Counter />))
})

app.listen(3000, () => {
  console.log('> running on https://localhost:3000')
})
