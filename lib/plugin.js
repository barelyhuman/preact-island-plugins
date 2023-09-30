const { resolve, extname } = require('path')
const path = require('path')
const { readFileSync } = require('fs')
const walk = require('acorn-walk')
const {
  getDefaultExport,
  getDefaultExportName,
  astFromCode,
  addImportToAST,
  codeFromAST,
  getNamedExport,
  removeExportFromAST,
} = require('./ast')
const { toHash } = require('./hash')
const { extend: jsxWalk } = require('acorn-jsx-walk')

const manifest = {}

// Add JSX support for walker
jsxWalk(walk.base)

exports.generateIslandsWithSource = generateIslandsWithSource
exports.generateIslands = generateIslands
exports.getManifest = getManifest

/**
 * @param {string} sourceCode
 * @param {string} filepath
 * @param {import('./types').Options} options
 */
function generateIslandsWithSource(sourceCode, filepath, options) {
  const workingDir = resolve(options.rootDir, '.generated')
  let outputFilePath = resolve(filepath).replace(options.rootDir, workingDir)

  const result = {
    code: {
      server: sourceCode,
      client: '',
    },
    paths: {
      client: '',
    },
  }
  const baseURL = options.baseURL || '/'

  let isIsland = hasTopLevelComment(sourceCode)
  const ast = astFromCode(sourceCode)

  if (!isIsland) {
    isIsland = staticAnalyseIfIsland(ast)
  }

  if (!isIsland) {
    return result
  }

  const { viewModifier } = parseTopLevelComment(sourceCode)

  let clientOutput

  if (!(options.client && options.client.output)) {
    options.client = options.client || {}
    options.client.output = resolve(workingDir, 'client')
  }

  clientOutput = resolve(options.client.output, path.basename(filepath))
  const fileExt = extname(filepath)

  if (options.hash) {
    const hash = toHash(sourceCode)
    clientOutput = clientOutput.replace(fileExt, `-${hash}.js`)
  } else {
    clientOutput = clientOutput.replace(fileExt, `.js`)
  }

  if (!options.atomic) {
    manifest[filepath] = outputFilePath
  }

  let componentName = getDefaultExportName(ast)

  if (!componentName) {
    throw new Error(
      `Unsupported Component: ${filepath} doesn't export a default function / component`
    )
  }

  const clientCode = constructIslandClient(componentName, filepath, {
    viewMods: viewModifier,
  })
  const serverCode = constructIslandServer(ast, componentName, {
    baseURL,
    atomic: options.atomic,
    client: {
      output: clientOutput,
    },
  })

  result.code.server = serverCode
  result.code.client = clientCode
  result.paths.client = clientOutput

  return result
}

/**
 * @param {string} filepath
 * @param {import('./types').Options} options
 */
function generateIslands(filepath, options) {
  const sourceCode = readFileSync(filepath, 'utf8')
  return generateIslandsWithSource(sourceCode, filepath, options)
}

/**
 * @returns {Record<string,string>} manifest
 */
function getManifest() {
  return manifest
}

function getIslandName(name) {
  return `island${name.replace(/([A-Z])/g, '-$1').toLowerCase()}`
}

function constructIslandClient(name, importPath, { viewMods } = {}) {
  const islandName = getIslandName(name)

  return `
  import { render, h } from 'preact';
  
${readFileSync(resolve(__dirname, './client/helpers.js'), 'utf8')}

customElements.define("${islandName}", class Island${name} extends HTMLElement {
  constructor(){
    super();
  }

  async connectedCallback() {
      const c = await import(${JSON.stringify(importPath)});
      const props = JSON.parse(this.dataset.props  || '{}');
      this.baseProps = props
      this.component = c

      ${
        viewMods.lazy
          ? `this.renderOnView({threshold:${viewMods.threshold}})`
          : `this.renderIsland()`
      }
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
}

/**
 * @param {string} name
 * @param {object} options
 * @param {string} options.baseURL
 * @param {object} options.client
 * @param {string} options.client.output
 */
function constructIslandServer(ast, name, options = {}) {
  const { baseURL, client } = options
  const islandName = getIslandName(name)
  const scriptName = client.output
  const scriptBaseName = path.basename(scriptName)
  const [exportedComponent, position] = getDefaultExport(ast)

  /* 
    check if a named default export was added  
    eg:
      function Component(){
        return <></>
      }

      export {
        Component as default
      }

      If you do find one then we get rid of the default export 
      since we create a new default export which is the island
  */
  const namedExport = getNamedExport(ast, 'default')
  const removeExport = removeExportFromAST(ast)

  // If not a named export and exported declaration is a functional `function` component, move it to the end of
  // the body and remove the declaration
  if (!namedExport) {
    if (exportedComponent.declaration.type === 'FunctionDeclaration') {
      const func = exportedComponent.declaration
      ast.body.splice(position, 1, func)
    }
  } else {
    removeExport('default', { named: true })
  }

  const addImport = addImportToAST(ast)

  addImport('h', 'preact', { named: true })
  addImport('Fragment', 'preact', { named: true })

  let code
  if (options.atomic) {
    code = `
    export default function Island${name}(props) {
      return h(Fragment,{},
        h("${islandName}",{ "data-props": JSON.stringify(props) }, h(${name},props)),
        h("script",{async:true, src:"${path.join(
          baseURL,
          scriptBaseName
        )}", type:"module"}),
      )
    }
  `
  } else {
    code = `
    export default function Island${name}(props) {
      return h(
        Fragment,
        {},
        h(
          "${islandName}",
          {
            "data-props":JSON.stringify(props)
          },
          h(${name},props)
        )
      )
    }
  `
  }

  const serverAST = astFromCode(code)
  ast.body = ast.body.concat(serverAST.body)
  return codeFromAST(ast)
}

function hasTopLevelComment(sourceCode) {
  return (
    sourceCode.indexOf('//@island') > -1 ||
    sourceCode.indexOf('// @island') > -1
  )
}

function parseTopLevelComment(sourceCode) {
  const exists =
    sourceCode.indexOf('//@island') > -1 ||
    sourceCode.indexOf('// @island') > -1

  const result = {
    isIsland: false,
    viewModifier: {
      lazy: false,
    },
  }

  if (!exists) {
    return result
  }

  let commentLine

  for (let line of sourceCode.split('\n')) {
    if (line.indexOf('//@island') === -1 && line.indexOf('// @island') === -1) {
      continue
    }

    commentLine = line
    break
  }

  if (!commentLine) {
    return result
  }

  result.isIsland = true

  const parts = commentLine
    .split(' ')
    .filter(Boolean)
    .map(x => x.trim())

  parts.forEach(modType => {
    const modParams = modType.split(':')
    const [mod, param] = modParams
    if (mod === 'lazy') {
      result.viewModifier.lazy = true
      result.viewModifier.threshold = param ? +param : 0.5
    } else if (mod === 'load') {
      result.viewModifier.lazy = false
    }
  })

  return result
}

// TODO: modify to handle multiple named exports
function staticAnalyseIfIsland(ast) {
  let isIsland = false

  ast.body.forEach(childNode => {
    if (childNode.type == 'ExportDefaultDeclaration') {
      if (
        childNode.declaration.type === 'FunctionDeclaration' &&
        isFunctionIsland(childNode.declaration)
      ) {
        isIsland = true
      }
    }

    if (childNode.type == 'ExportNamedDeclaration') {
      // not handled right now
    }

    // // TODO: Enable once named exports are also handled
    // if (childNode.type == 'FunctionDeclaration') {
    //   if (isFunctionIsland(childNode)) {
    //     isIsland = true
    //   }
    // }

    // if (childNode.type == 'VariableDeclaration') {
    //   childNode.declarations.forEach(dec => {
    //     if (
    //       dec.init === 'ArrowFunctionExpression' ||
    //       dec.init === 'FunctionExpression'
    //     ) {
    //       if (isFunctionIsland(dec.init)) {
    //         isIsland = true
    //       }
    //     }
    //   })
    // }
  })

  return isIsland
}

function isFunctionIsland(functionAST) {
  // If it's not a block, then it's an immediate return
  // and would need to be explicity defined as an island since it's
  // not possible for us to assume if the passed down props are functions
  // or not

  if (!(functionAST.body && functionAST.body.type === 'BlockStatement')) {
    return false
  }

  const functionBody = functionAST.body.body || []

  if (!functionBody.length) return false

  // validate if there's a return statement that gives a JSX type element
  // before going down any further to look for triggers and invocations
  const hasReturn = functionBody.find(x => x.type === 'ReturnStatement')
  if (!hasReturn) {
    return false
  }
  if (!['JSXFragment', 'JSXElement'].includes(hasReturn.argument.type)) {
    return false
  }

  const internalTriggers = []
  let isIsland = false

  functionBody.forEach(statement => {
    if (statement.type == 'FunctionDeclaration') {
      internalTriggers.push(statement.id.name)
    }
    if (statement.type == 'VariableDeclaration') {
      const hasArrow = statement.declarations.find(
        x => x.init.type === 'ArrowFunctionExpression'
      )
      if (!hasArrow) {
        return
      }
      internalTriggers.push(hasArrow.id.name)
    }
  })

  walk.simple(functionAST, {
    Identifier(node) {
      if (/(use[A-Z])/.test(node.name)) {
        isIsland = true
      }
    },
    JSXAttribute(node) {
      if (
        node.value.type === 'JSXExpressionContainer' &&
        (node.value.expression.type === 'ArrowFunctionExpression' ||
          (node.value.expression.type == 'Identifier' &&
            internalTriggers.includes(node.value.expression.name)))
      ) {
        isIsland = true
      }
    },
  })

  return isIsland
}
