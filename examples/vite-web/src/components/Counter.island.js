import { useState } from 'preact/hooks'

export default function Counter({ initCount }) {
  const [count, setCount] = useState(initCount)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
