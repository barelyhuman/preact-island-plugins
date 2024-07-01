import express from 'express'
import render from 'preact-render-to-string'
import Counter from './components/Counter'
import { join } from 'node:path'

const app = express()
const router = express.Router()

router.get('/ping', (req, res) => {
  return res.send(render(<Counter />))
})

const root = __dirname
const staticRoot = join(root, 'client')

app.use(router)
app.use('/public', express.static(staticRoot))

app.listen(3000, () => {
  console.log('Listening on 3000')
})
