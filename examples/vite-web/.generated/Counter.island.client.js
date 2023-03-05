import { h, render } from 'preact'

customElements.define(
  'island-counter',
  class IslandCounter extends HTMLElement {
    async connectedCallback() {
      const c = await import(
        '/Users/reaper/code/preact-island/examples/vite-web/src/components/Counter.island.js'
      )
      const props = JSON.parse(this.dataset.props || '{}')
      render(h(c.default, props), this, this)
    }
  }
)
