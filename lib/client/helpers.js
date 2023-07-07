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
