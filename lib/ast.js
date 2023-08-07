const acorn = require('acorn')
const generate = require('./astring')
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
