import { useState } from 'preact/hooks'

type Props = {
  initValue: number
}

export default function Counter({ initValue = 0 }: Props) {
  const [x, setX] = useState(initValue)

  const onClick = () => {
    setX(x + 1)
  }

  return <button onClick={onClick}>{x}</button>
}
