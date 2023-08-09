// @island

import { signal } from '@preact/signals'
import Counter from './Counter'
import TextIsland from './TextIsland'
import CounterTS from './CounterTS'

const count = signal(0)

export default function Container({ children }) {
  return (
    <>
      <Counter value={count} inc={() => (count.value += 1)} />
      <CounterTS value={count} inc={() => (count.value += 1)} />
      <TextIsland />
    </>
  )
}
