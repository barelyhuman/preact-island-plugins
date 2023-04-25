import { ParseResult, parse as jsxParser } from '@babel/parser'
import babel from '@babel/core'
import _generate from '@babel/generator'
import tsPreset from '@babel/preset-typescript'

const generate = _generate.default

export function astFromCode(code: string): any {
  const ast = jsxParser(code, {
    sourceType: 'module',
  })

  return ast.program.body[0]
}

//@ts-expect-error type defs
export const codeFromAST = ast => {
  const code = generate(ast).code
  return code
}

export async function sourceToAST(
  sourceCode: string
): Promise<ParseResult<any>> {
  const transformed = babel.transformSync(sourceCode, {
    presets: [
      [
        tsPreset,
        {
          allExtensions: true,
          isTSX: true,
        },
      ],
    ],
  })

  const _code = transformed?.code ? transformed.code : ''

  return jsxParser(_code, {
    sourceType: 'module',
    plugins: ['jsx'],
  })
}
