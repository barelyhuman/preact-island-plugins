// @ts-expect-error no-types
import _generate from '@babel/generator'
import { parse as jsxParser } from '@babel/parser'

import fs from 'fs/promises'
import path from 'path'

const PREFIX = '[preact-island]'

const generate = _generate.default

const PREACT_IMPORT_FRAG_AST = astFromCode(`import {Fragment} from "preact";`)

const PREACT_IMPORT_AST = astFromCode(`import {h} from "preact";`)

export type Options = {
  atomic: boolean
}

async function sourceToAST(sourceCode: string) {
  return jsxParser(sourceCode, {
    sourceType: 'module',
    plugins: ['jsx'],
  })
}

export async function sourceToIslands(
  sourcePath: string,
  clientDir: string,
  options: Options
) {
  let ast

  try {
    const stat = await fs.stat(sourcePath)
    if (!stat.isFile())
      throw new Error(
        `${PREFIX} Invalid Source, the provided source was not a valid filepath: ${sourcePath}`
      )
    const source = await fs.readFile(sourcePath, 'utf8')
    ast = await sourceToAST(source)
  } catch (err) {
    throw new Error(
      `${PREFIX} Invalid Source, the provided source failed to parse: ${sourcePath}`
    )
  }

  const funcName = await getDefaultExportName(ast, sourcePath)
  const client = buildIslandClient(funcName, sourcePath)
  const server = buildIslandServer(
    funcName,
    ast,
    sourcePath,
    clientDir,
    options
  )

  return { client, server, ast }
}

async function getDefaultExportName(ast: any, filePath: string) {
  let funcName = ''
  for (let i = 0; i <= ast.program.body.length; i++) {
    const child = ast.program.body[i]
    if (child.type !== 'ExportDefaultDeclaration') continue

    if (child.declaration.type === 'Identifier') {
      funcName = child.declaration.name
      break
    }

    if (child.declaration.type === 'FunctionDeclaration') {
      const func = child.declaration
      if (func.id && func.id.type === 'Identifier') {
        funcName = func.id.name
      } else {
        throw new Error(
          `${PREFIX} Unsupported Component: ${filePath} doesn't export a default function / component`
        )
      }
      break
    }
  }
  return funcName
}

export function buildIslandClient(name: string, importPath: string) {
  const islandName = getIslandName(name)
  return `import { h, hydrate } from 'preact'; 
  
customElements.define("${islandName}", class Island${name} extends HTMLElement { 
  async connectedCallback() {
      const c = await import(${JSON.stringify(importPath)}); 
      const props = JSON.parse(this.dataset.props || '{}'); 
      hydrate(h(c.default, props), this);
  } 
})`
}

function buildIslandServer(
  funcName: string,
  ast: any,
  sourcePath: string,
  clientDir: string,
  options: Options
) {
  let hasPreactImport = false,
    hasHImport = false,
    hasFragImport = false

  ast.program.body.forEach((child: any, index: number) => {
    if (child.type === 'ExportDefaultDeclaration') {
      if (child.declaration.type === 'Identifier') {
        ast.program.body.splice(index, 1)
        return
      }

      if (child.declaration.type === 'FunctionDeclaration') {
        const func = child.declaration
        ast.program.body.splice(index, 1, func)
        return
      }
    }
    if (child.type === 'ImportDeclaration') {
      if (
        child.source.type === 'StringLiteral' &&
        child.source.value === 'preact'
      )
        hasPreactImport = true

      if (
        hasPreactImport &&
        child.specifiers.findIndex((x: any) => x.imported.name === 'h') > -1
      )
        hasHImport = true

      if (
        hasPreactImport &&
        child.specifiers.findIndex((x: any) => x.imported.name === 'Fragment') >
          -1
      )
        hasFragImport = true
    }
  })

  if (!hasHImport) ast.program.body.unshift(PREACT_IMPORT_AST)
  if (!hasFragImport) ast.program.body.unshift(PREACT_IMPORT_FRAG_AST)

  ast.program.body.push(
    modifyASTForIslandWrapper(funcName, sourcePath, clientDir, options)
  )
  return generate(ast).code
}

function getIslandName(name: string): string {
  return `island${name.replace(/([A-Z])/g, '-$1').toLowerCase()}`
}

export function modifyASTForIslandWrapper(
  name: string,
  sourcePath: string,
  clientDir: string,
  options: Options
) {
  const islandName = getIslandName(name)
  const scriptName = sourcePath.trim().replace(/.js$/, '.client.js')
  const scriptBaseName = path.basename(scriptName)
  let code
  if (options.atomic) {
    code = `
    export default function Island${name}(props) {
      return h(Fragment,{},
        h("${islandName}",{ "data-props": JSON.stringify(props) },h(${name}, props)),
        h("script",{async:true, src:"${path.join(
          clientDir,
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
  return astFromCode(code)
}

function astFromCode(code: string): any {
  const ast = jsxParser(code, {
    sourceType: 'module',
  })

  return ast.program.body[0]
}
