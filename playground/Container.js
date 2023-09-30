import { signal } from '@preact/signals'
import Counter from './Counter'
import TextIsland from './TextIsland'
import CounterTS from './CounterTS'

const count = signal(0)

export default function Container({ children }) {
  function onInc() {
    count.value += 1
  }
  return (
    <>
      <div>
        <p>Shared State:</p>
        <Counter value={'+'} inc={onInc} />
        <span>{count}</span>
        <CounterTS value={'-'} inc={() => (count.value -= 1)} />
      </div>
      <TextIsland />
    </>
  )
}
