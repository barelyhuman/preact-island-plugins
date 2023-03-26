import Counter from './Counter.island'

export default function () {
  const initData = { initValue: 10 }
  return (
    <>
      <section>
        <h1>Hello from Preact Islands</h1>
      </section>
      <Counter {...initData} />
    </>
  )
}
