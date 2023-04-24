import fs from 'fs/promises'
import path from 'path'
import { astFromCode, codeFromAST, sourceToAST } from './ast'

const PREFIX = '[preact-island]'

const PREACT_IMPORT_FRAG_AST = astFromCode(`import {Fragment} from "preact";`)

const PREACT_IMPORT_AST = astFromCode(`import {h} from "preact";`)

export type Options = {
  atomic: boolean
  nameModifier?: (name: string) => string
}

type SourceToIslands = {
  client: string
  server: string
  ast: any
}

export async function sourceToIslands(
  sourcePath: string,
  baseURL: string,
  options: Options
) {
  try {
    const stat = await fs.stat(sourcePath)
    if (!stat.isFile())
      throw new Error(
        `${PREFIX} Invalid Source, the provided source was not a valid filepath: ${sourcePath}`
      )
    const source = await fs.readFile(sourcePath, 'utf8')
    return sourceDataToIslands(source, sourcePath, baseURL, options)
  } catch (err) {
    throw new Error(
      `${PREFIX} Invalid Source, the provided source failed to parse: ${sourcePath}`
    )
  }
}

export async function sourceDataToIslands(
  sourceCode: string,
  sourcePath: string,
  baseURL: string,
  options: Options
): Promise<SourceToIslands> {
  const ast = await sourceToAST(sourceCode)
  const funcName = await getDefaultExportName(ast, sourcePath)
  const client = buildIslandClient(funcName, sourcePath)
  const server = buildIslandServer(funcName, ast, sourcePath, baseURL, options)
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
  return `
import { h, hydrate } from 'preact'; 
  
  
const restoreTree = (type, props={}) => {
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
      restoreTree(props.children.type || '', props.children.props || {})
    )
  }

  return h(type, props)
}

customElements.define("${islandName}", class Island${name} extends HTMLElement { 
  async connectedCallback() {
      const c = await import(${JSON.stringify(importPath)}); 
      const props = JSON.parse(this.dataset.props  || '{}'); 
      hydrate(restoreTree(c.default, props, props.children || []), this)
  } 
})`
}

function buildIslandServer(
  funcName: string,
  ast: any,
  sourcePath: string,
  baseURL: string,
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
    modifyASTForIslandWrapper(funcName, sourcePath, baseURL, options)
  )
  return codeFromAST(ast)
}

function getIslandName(name: string): string {
  return `island${name.replace(/([A-Z])/g, '-$1').toLowerCase()}`
}

export function defaultModifier(name: string) {
  return name.trim().replace(/.(js|ts)x?$/, '.client.js')
}

export function modifyASTForIslandWrapper(
  name: string,
  sourcePath: string,
  baseURL: string,
  options: Options
) {
  options.nameModifier = options.nameModifier || defaultModifier
  const islandName = getIslandName(name)
  const scriptName = options.nameModifier(sourcePath)
  const scriptBaseName = path.basename(scriptName)
  let code
  if (options.atomic) {
    code = `
    export default function Island${name}(props) {
      return h(Fragment,{},
        h("${islandName}",{ "data-props": JSON.stringify(props) },h(${name}, props)),
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

  return astFromCode(code)
}
