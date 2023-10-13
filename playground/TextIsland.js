import { useState } from 'preact/hooks'

export default function TextIsland() {
  const [message, setMessage] = useState('Some Text')
  return <a href="/">{message}</a>
}
