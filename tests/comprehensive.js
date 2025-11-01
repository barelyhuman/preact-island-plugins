const { test } = require('uvu')
const { inlineSnapshot } = require('uvu-inline-snapshot')
const { generateIslandsWithSource } = require('../lib/plugin')

test('should handle island with arrow function component', async () => {
  const output = generateIslandsWithSource(
    `
      // @island
      const Component = () => {
        return <p>hello</p>
      }

      export default Component
    `,
    './index.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
      },
    }
  )

  await inlineSnapshot(
    output.code.server,
    `import {Fragment} from "preact";
import {h} from "preact";
const Component = () => {
  return <p>hello</p>;
};
export default Component;
export default function IslandComponent(props) {
  return h(Fragment, {}, h("island-component", {
    "data-props": JSON.stringify(props)
  }, h(Component, props)));
}
`
  )
})

test('should handle island with lazy loading', async () => {
  const output = generateIslandsWithSource(
    `
      // @island lazy
      export default function Component(){
        return <p>hello</p>
      }
    `,
    './index.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
      },
    }
  )

  // Check that the client code includes lazy loading logic
  const clientCode = output.code.client
  if (!clientCode.includes('renderOnView')) {
    throw new Error('Lazy loading not implemented in client code')
  }

  if (!clientCode.includes('IntersectionObserver')) {
    throw new Error('IntersectionObserver not used for lazy loading')
  }
})

test('should handle island with custom lazy threshold', async () => {
  const output = generateIslandsWithSource(
    `
      // @island lazy:0.8
      export default function Component(){
        return <p>hello</p>
      }
    `,
    './index.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
      },
    }
  )

  // Check that the threshold is set correctly
  if (!output.code.client.includes('threshold:0.8')) {
    throw new Error('Custom threshold not applied')
  }
})

test('should handle atomic mode', async () => {
  const output = generateIslandsWithSource(
    `
      // @island
      export default function Component(){
        return <p>hello</p>
      }
    `,
    './index.jsx',
    {
      rootDir: '.',
      baseURL: '/public',
      atomic: true,
      client: {
        output: '.islands',
      },
    }
  )

  // In atomic mode, should include script tag
  if (!output.code.server.includes('h("script"')) {
    throw new Error('Atomic mode should include script tag')
  }
})

test('should handle non-atomic mode', async () => {
  const output = generateIslandsWithSource(
    `
      // @island
      export default function Component(){
        return <p>hello</p>
      }
    `,
    './index.jsx',
    {
      rootDir: '.',
      baseURL: '/public',
      atomic: false,
      client: {
        output: '.islands',
      },
    }
  )

  // In non-atomic mode, should not include script tag
  if (output.code.server.includes('<script')) {
    throw new Error('Non-atomic mode should not include script tag')
  }
})

test('should handle hash option', async () => {
  const output = generateIslandsWithSource(
    `
      // @island
      export default function Component(){
        return <p>hello</p>
      }
    `,
    './index.jsx',
    {
      rootDir: '.',
      hash: true,
      client: {
        output: '.islands',
      },
    }
  )

  // Should have hash in the client path
  if (!output.paths.client.includes('-')) {
    throw new Error('Hash not applied to client path')
  }
})

test('should handle replaceParentNode option', async () => {
  const output = generateIslandsWithSource(
    `
      // @island
      export default function Component(){
        return <p>hello</p>
      }
    `,
    './index.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
        replaceParentNode: true,
      },
    }
  )

  // Should pass replaceParentNode to render call
  if (
    !output.code.client.includes(
      'render(restoreTree(this.component.default, this.baseProps), this, this)'
    )
  ) {
    throw new Error('replaceParentNode not applied correctly')
  }
})

test('should detect island by filename pattern', async () => {
  const output = generateIslandsWithSource(
    `
      export default function Component(){
        return <p>hello</p>
      }
    `,
    './Component.island.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
      },
    }
  )

  // Should detect as island based on filename
  if (output.code.server === output.code.client) {
    throw new Error('Island not detected by filename pattern')
  }
})

test('should handle component with event handlers', async () => {
  const output = generateIslandsWithSource(
    `
      export default function Component(){
        const handleClick = () => {}
        return <button onClick={handleClick}>hello</button>
      }
    `,
    './index.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
      },
    }
  )

  // Should detect as island due to event handler
  if (output.code.server === output.code.client) {
    throw new Error('Island not detected by event handler')
  }
})

test('should handle component with internal function', async () => {
  const output = generateIslandsWithSource(
    `
      export default function Component(){
        const internalFunc = () => {}
        return <button onClick={internalFunc}>hello</button>
      }
    `,
    './index.jsx',
    {
      rootDir: '.',
      client: {
        output: '.islands',
      },
    }
  )

  // Should detect as island due to internal function used in JSX
  if (output.code.server === output.code.client) {
    throw new Error('Island not detected by internal function in JSX')
  }
})

test('should not detect island for component with only data attributes', async () => {
  const code = `
      export default function Component(){
        return <div data-test="value">hello</div>
      }
    `
  const output = generateIslandsWithSource(code, './index.jsx', {
    rootDir: '.',
    client: {
      output: '.islands',
    },
  })

  // Should not detect as island - only data attributes
  if (output.code.server !== code) {
    throw new Error('Incorrectly detected island for data attributes only')
  }
})

test.run()
