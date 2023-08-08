// @island
import type { Signal } from '@preact/signals'

type Props = {
  value: Signal<number>
  inc: () => void
}

export default function CounterTS({ value, inc }: Props) {
  return <button onClick={inc}>{value}</button>
}
