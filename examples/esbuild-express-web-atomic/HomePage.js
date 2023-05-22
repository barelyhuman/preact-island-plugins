import Counter from './Counter.island.js'
import Todo from './Todo.js'

export default function () {
  const initData = { initValue: 10 }
  return (
    <>
      <section>
        <h1>Hello from Preact Islands</h1>
      </section>
      <div>
        <h1>Counter</h1>
        <Counter {...initData} />
      </div>
      <div>
        <h1>Todo</h1>
        <Todo />
      </div>
    </>
  )
}
