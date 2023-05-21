const components = await import.meta.glob('../.generated/*.client.jsx')

Object.keys(components).forEach(async k => {
  components[k]()
  // await import(
  //   /* @vite-ignore */
  //   k
  // );
})
