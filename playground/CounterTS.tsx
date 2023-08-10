// @island

import { signal, type Signal } from '@preact/signals'

type Props = {
  value: Signal<number>
  inc: () => void
}

const internalCount = signal(0)

export default function CounterTS({ value, inc }: Props) {
  // @ts-ignore no tsconfig in the playgroud
  return (
    <>
      <button onClick={inc}>{value}</button>
      <button onClick={() => (internalCount.value += 1)}>
        internal:{internalCount}
      </button>
    </>
  )
}
