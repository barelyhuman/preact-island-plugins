// @island
import type { Signal } from '@preact/signals'

type Props = {
  value: Signal<number>
  inc: () => void
}

export default function CounterTS({ value, inc }: Props) {
  // @ts-ignore no tsconfig in the playgroud
  return <button onClick={inc}>{value}</button>
}
