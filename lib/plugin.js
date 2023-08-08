const { resolve, extname } = require('path')
const path = require('path')
const { readFileSync } = require('fs')
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

const manifest = {}

exports.generateIslands = generateIslands
exports.getManifest = getManifest

/**
 * @param {string} filepath
 * @param {import('./types').Options} options
 */
function generateIslands(filepath, options) {
  const workingDir = resolve(options.rootDir, '.generated')
  let outputFilePath = resolve(filepath).replace(options.rootDir, workingDir)
  const sourceCode = readFileSync(filepath, 'utf8')

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

  const isIsland =
    sourceCode.indexOf('//@island') > -1 ||
    sourceCode.indexOf('// @island') > -1

  if (!isIsland) {
    return result
  }

  let clientOutput

  if (!(options.client && options.client.output)) {
    options.client = options.client || {}
    options.client.output = resolve(workingDir, 'client')
  }

  clientOutput = resolve(options.client.output, path.basename(filepath))

  if (options.hash) {
    const hash = toHash(sourceCode)
    const fileExt = extname(filepath)
    clientOutput = clientOutput.replace(fileExt, `-${hash}.js`)
  }

  if (!options.atomic) {
    manifest[filepath] = outputFilePath
  }

  const ast = astFromCode(sourceCode)
  let componentName = getDefaultExportName(ast)

  if (!componentName) {
    throw new Error(
      `Unsupported Component: ${filepath} doesn't export a default function / component`
    )
  }

  const clientCode = constructIslandClient(componentName, filepath)
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
 * @returns {Record<string,string>} manifest
 */
function getManifest() {
  return manifest
}

function getIslandName(name) {
  return `island${name.replace(/([A-Z])/g, '-$1').toLowerCase()}`
}

function constructIslandClient(name, importPath) {
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
      mergePropsWithDOM(this,props);
      render(restoreTree(c.default, props), this, this)
  }
})
  
  `
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
