import { useState } from 'preact/hooks'

export default function Counter({ initValue = 0 }) {
  const [x, setX] = useState(initValue)
  return (
    <>
      <button onClick={_ => setX(x + 1)}>{x}</button>
    </>
  )
}
