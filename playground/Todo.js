//@island

import { useState } from 'preact/hooks'

export default function Todo() {
  const [todoList, setTodoList] = useState([])
  const [todoValue, setTodoValue] = useState('')

  const addTodo = () => {
    setTodoList(todoList.concat({ todo: todoValue }))
    setTodoValue('')
  }

  return (
    <>
      <input value={todoValue} onChange={e => setTodoValue(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todoList.map((x, i) => {
          return <li key={i}>{x.todo}</li>
        })}
      </ul>
    </>
  )
}
