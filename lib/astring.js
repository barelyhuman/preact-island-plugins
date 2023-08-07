// Modified version of astring-jsx to handle
// certain jsx elements that the upstream astring
// doesn't handle yet
// https://github.com/Qard/astring-jsx/issues/8

const astringJSX = require('astring-jsx')
var extend = require('xtend')

const generator = Object.assign(
  {
    JSXFragment: function JSXFragment(node, state) {
      var output = state.output
      output.write('<>')
      for (child of node.children) {
        this[child.type](child, state)
      }
      output.write('</>')
    },
    JSXEmptyExpression: function JSXEmptyExpression(node, state) {
      // do nothing
    },
    JSXText: function JSXText(node, state) {
      var output = state.output
      output.write(node.value)
    },
  },
  astringJSX.generator
)

function astring(ast, options) {
  return astringJSX(
    ast,
    extend(
      {
        generator: generator,
      },
      options
    )
  )
}

astring.generator = generator
module.exports = astring
