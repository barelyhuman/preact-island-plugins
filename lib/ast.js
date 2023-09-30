const acorn = require('acorn')
const { generate } = require('@barelyhuman/astring-jsx')
const jsx = require('acorn-jsx')
const classFields = require('acorn-class-fields')
const { importAssertions } = require('acorn-import-assertions')
const staticClassFeatures = require('acorn-static-class-features')

const jsxParser = acorn.Parser.extend(
  jsx(),
  classFields,
  importAssertions,
  staticClassFeatures
)

exports.astFromCode = astFromCode
exports.codeFromAST = codeFromAST
exports.getDefaultExportName = getDefaultExportName
exports.getDefaultExport = getDefaultExport
exports.addImportToAST = addImportToAST
exports.getNamedExport = getNamedExport
exports.removeExportFromAST = removeExportFromAST
exports.isTopLevelFunction = isTopLevelFunction

function astFromCode(code) {
  const ast = jsxParser.parse(code, {
    sourceType: 'module',
    ecmaVersion: '2020',
  })
  return ast
}

function codeFromAST(ast) {
  return generate(ast)
}

function getNamedExport(ast, name) {
  let defExport
  for (let i = 0; i < ast.body.length; i++) {
    const child = ast.body[i]
    if (child.type === 'ExportNamedDeclaration') {
      for (let specifier of child.specifiers) {
        if (specifier.exported && specifier.exported.name === name) {
          defExport = specifier
          break
        }
      }
    }
  }
  return defExport
}

/**
 * NOT A PURE FUNCTION!
 * removes the export from the passed AST
 */
function removeExportFromAST(ast) {
  /**
   * @param {string} name
   * @param {object} options
   * @param {boolean} options.named
   */
  return (name, options) => {
    if (options.named) {
      return removeNamedExport(ast, name)
    }
    // TODO: excessive handling for various kinds of exports
    // so leaving it to be handled based on usecase if it ever arrives
  }
}

function removeNamedExport(ast, name) {
  for (let i = 0; i < ast.body.length; i++) {
    const child = ast.body[i]
    if (child.type !== 'ExportNamedDeclaration') continue

    // FIXME: can be made faster
    for (let index in child.specifiers) {
      const specifier = child.specifiers[index]
      if (!(specifier.exported && specifier.exported.name === name)) continue

      // FIXME: can be made faster
      child.specifiers.splice(index, 1)
      break
    }
  }
}

function getDefaultExport(ast) {
  let defExport, position

  for (let i = 0; i < ast.body.length; i++) {
    const child = ast.body[i]
    position = i
    if (child.type !== 'ExportDefaultDeclaration') continue
    defExport = child
    break
  }
  return [defExport, position]
}

/**
 * Takes in an AST node and returns the name of the default
 * export for it
 * @param {*} ast
 * @returns
 */
function getDefaultExportName(ast) {
  let funcName = ''
  const [defExport] = getDefaultExport(ast)
  let namedExport = getNamedExport(ast, 'default')

  if (!defExport && !namedExport) {
    throw new Error('No default export from the island file')
  }

  if (namedExport) return namedExport.local.name

  if (defExport.declaration.type === 'Identifier') {
    funcName = defExport.declaration.name
  } else if (defExport.declaration.type === 'FunctionDeclaration') {
    const func = defExport.declaration
    if (func.id && func.id.type === 'Identifier') {
      funcName = func.id.name
    }
  }

  return funcName
}

/**
 * NOT A PURE FUNCTION!
 * modifies the passed AST with the
 * requested import
 *
 * Note:
 * This function does not rename / or add a new identifier for the
 * requested import as that could add in a lot more complexity
 * and is easier handled in the user land. Changing and renaming
 * import specifier would also need proper tranformation to be handled
 * for cases where the imports might be responsible for things
 * like JSX.
 * @param {string} name
 * @param {string} from
 * @param {object} options
 * @param {boolean} options.named
 */
function addImportToAST(ast) {
  return (name, from, { named }) => {
    for (let child of ast.body) {
      if (child.type !== 'ImportDeclaration') continue

      // Check if the node is a Literal (String/Number) and is the same value
      // as requested for import. If not, just continue to the next child
      if (!(child.source.type === 'Literal' && child.source.value === from))
        continue

      // Go through the imports to check if the import (either named or default)
      // exists already in the code
      // if yes, then do nothing.
      const hasExistingImport =
        child.specifiers.findIndex(x => {
          if (named) {
            return x.type === 'ImportSpecifier' && x.imported.name === name
          } else {
            return x.type === 'ImportDefaultSpecifier' && x.local.name === name
          }
        }) > -1

      if (hasExistingImport) {
        return
      }
    }

    const importAST = astFromCode(
      named
        ? `import { ${name} } from "${from}";`
        : `import ${name} from "${from}"`
    )

    ast.body.unshift(importAST.body[0])
  }
}

function isTopLevelFunction(parents) {
  if (parents.length > 3) {
    // already too deep to be a top level function declaration
    return false
  }

  const validChildChain = parents.slice(0, 2).find(x => {
    if (x.type === 'ExportDefaultDeclaration') {
      return true
    }

    return false
  })

  return validChildChain
}
