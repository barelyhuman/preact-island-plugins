const acorn = require('acorn')
const generate = require('astring-jsx')
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
 *
 * @param {string} name
 * @param {string} from
 * @param {object} options
 * @param {boolean} options.named
 */
function addImportToAST(ast) {
  return (name, from, { named }) => {
    const importAST = astFromCode(
      named
        ? `import { ${name} } from "${from}";`
        : `import ${name} from "${from}"`
    )

    ast.body.unshift(importAST.body[0])
  }
}
