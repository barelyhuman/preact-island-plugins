import { HomePage } from './components/HomePage'

export default function (router) {
  router.get('/', async (req, res) => {
    return res.renderWithPreact(HomePage)
  })
}
