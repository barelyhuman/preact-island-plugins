import { h, render } from 'preact'

const restoreTree = (type, props = {}) => {
  if (typeof props.children === 'object') {
    if (Array.isArray(props.children)) {
      return h(
        type,
        props,
        ...props.children.map(x => {
          return restoreTree(x.type, x.props)
        })
      )
    }
    return h(
      type,
      props,
      restoreTree(props.children.type || '', props.children.props || {})
    )
  }

  return h(type, props)
}

customElements.define(
  'island-counter',
  class IslandCounter extends HTMLElement {
    async connectedCallback() {
      const c = await import(
        '/Users/reaper/active/preact-island-plugins/examples/vite-web/src/components/Counter.island.js'
      )
      const props = JSON.parse(this.dataset.props || '{}')
      render(restoreTree(c.default, props, props.children || []), this, this)
    }
  }
)
