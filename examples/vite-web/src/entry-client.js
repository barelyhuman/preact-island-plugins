const modules = import.meta.glob('../.generated/*.client.js')

Object.keys(modules).forEach(async k => {
  await import(
    /* @vite-ignore */
    k
  )
})
