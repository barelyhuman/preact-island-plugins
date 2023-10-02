const { test } = require('uvu')
const { inlineSnapshot } = require('uvu-inline-snapshot')
const { generateIslandsWithSource } = require('../lib/plugin')

test('should just return the server code if not an island', async () => {
  const output = generateIslandsWithSource(
    `
            export default function Component(){
                return <p>hello</p>
            }
    `,
    './index.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
      },
    }
  )

  await inlineSnapshot(output.code.client, ``)
  await inlineSnapshot(
    output.code.server,
    `
            export default function Component(){
                return <p>hello</p>
            }
    `
  )
})

test('should return server and client code for an island', async () => {
  const output = generateIslandsWithSource(
    `
      // @island 
      export default function Component(){ 
        return <p>hello</p>
      }
    `,
    './index.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
      },
    }
  )

  await inlineSnapshot(
    output.code.client,
    `
  import { render, h } from 'preact';
  
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
      restoreTree(props.children.type, props.children.props || {})
    )
  }

  return h(type, props)
}

function mergePropsWithDOM(rootNode, props) {
  const scripts = new Map()
  function walk(node, propPoint) {
    Array.from(node.childNodes || [])
      .filter(x => {
        if (x.localName != 'script') {
          return true
        } else {
          scripts.set(x.src, x)
        }
      })
      .forEach((child, index) => {
        let _prop = propPoint
        if (Array.isArray(propPoint) && propPoint[index]) {
          _prop = propPoint[index]
        }
        if (/^island-(.*)+/.test(child.localName)) {
          _prop.type = child.localName
          if (_prop.props) {
            _prop.props['data-props'] = JSON.stringify(_prop.props)
          }
        }
        if (child.childNodes.length > 0) {
          if (propPoint.children) {
            walk(child, propPoint.children)
          }
        }
      })
  }
  walk(rootNode, props)
  rootNode.innerHTML = ''
  const scriptNodes = [...scripts].map(([k, v]) => v)
  rootNode.append(...scriptNodes)
}


customElements.define("island-component", class IslandComponent extends HTMLElement {
  constructor(){
    super();
  }

  async connectedCallback() {
      const c = await import("./index.jsx");
      const props = JSON.parse(this.dataset.props  || '{}');
      this.baseProps = props
      this.component = c

      this.renderIsland()
  }

  renderOnView({threshold} = {}){
    const options = {
      root: null,
      threshold,
    };

    const self = this;

    const callback = function(entries, observer) {
       entries.forEach((entry) => {
        if(!entry.isIntersecting) return 
        self.renderIsland()
       });
    }

    let observer = new IntersectionObserver(callback, options);
    observer.observe(this);
  }

  renderIsland(){
    mergePropsWithDOM(this, this.baseProps);
    render(restoreTree(this.component.default, this.baseProps), this, this)
  }
})`
  )
  await inlineSnapshot(
    output.code.server,
    `import {Fragment} from "preact";
import {h} from "preact";
function Component() {
  return <p>hello</p>;
}
export default function IslandComponent(props) {
  return h(Fragment, {}, h("island-component", {
    "data-props": JSON.stringify(props)
  }, h(Component, props)));
}
`
  )
})

test('should return server and client code for an auto-detected island from hook', async () => {
  const output = generateIslandsWithSource(
    `
        import {useState} from "preact/hooks"
        export default function Component(){ 
            const s = useState(0)
          return <p>hello</p>
        }
      `,
    './index.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
      },
    }
  )

  await inlineSnapshot(
    output.code.client,
    `
  import { render, h } from 'preact';
  
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
      restoreTree(props.children.type, props.children.props || {})
    )
  }

  return h(type, props)
}

function mergePropsWithDOM(rootNode, props) {
  const scripts = new Map()
  function walk(node, propPoint) {
    Array.from(node.childNodes || [])
      .filter(x => {
        if (x.localName != 'script') {
          return true
        } else {
          scripts.set(x.src, x)
        }
      })
      .forEach((child, index) => {
        let _prop = propPoint
        if (Array.isArray(propPoint) && propPoint[index]) {
          _prop = propPoint[index]
        }
        if (/^island-(.*)+/.test(child.localName)) {
          _prop.type = child.localName
          if (_prop.props) {
            _prop.props['data-props'] = JSON.stringify(_prop.props)
          }
        }
        if (child.childNodes.length > 0) {
          if (propPoint.children) {
            walk(child, propPoint.children)
          }
        }
      })
  }
  walk(rootNode, props)
  rootNode.innerHTML = ''
  const scriptNodes = [...scripts].map(([k, v]) => v)
  rootNode.append(...scriptNodes)
}


customElements.define("island-component", class IslandComponent extends HTMLElement {
  constructor(){
    super();
  }

  async connectedCallback() {
      const c = await import("./index.jsx");
      const props = JSON.parse(this.dataset.props  || '{}');
      this.baseProps = props
      this.component = c

      this.renderIsland()
  }

  renderOnView({threshold} = {}){
    const options = {
      root: null,
      threshold,
    };

    const self = this;

    const callback = function(entries, observer) {
       entries.forEach((entry) => {
        if(!entry.isIntersecting) return 
        self.renderIsland()
       });
    }

    let observer = new IntersectionObserver(callback, options);
    observer.observe(this);
  }

  renderIsland(){
    mergePropsWithDOM(this, this.baseProps);
    render(restoreTree(this.component.default, this.baseProps), this, this)
  }
})`
  )
  await inlineSnapshot(
    output.code.server,
    `import {Fragment} from "preact";
import {h} from "preact";
import {useState} from "preact/hooks";
function Component() {
  const s = useState(0);
  return <p>hello</p>;
}
export default function IslandComponent(props) {
  return h(Fragment, {}, h("island-component", {
    "data-props": JSON.stringify(props)
  }, h(Component, props)));
}
`
  )
})

test.run()
