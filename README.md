# preact-island-plugins

> Preact server rendered, partial hydration and islands for everyone!

<img alt="preact-logo" src="/.github/assets/preact.svg" />

## TOC

- [Highlights](#highlights)
- [Installation](#installation)
- [Usage](#usage)
- [Concepts](#concepts)
  - [File Name Extensiom](#file-name-extensiom)
  - [Top Level comments](#top-level-comments)
  - [Lazy Hydration](#lazy-hydration)
- [Limitations](#limitations)
- [Example Configs](#example-configurations)
- [How](#how)
- [FAQs](#faqs)
- [Contributing](#contributing)

## Highlights

- Tiny
- Tree Shakeable
- Flexibile / Not dependent on folder structure
  - Use either `.island.js` file extensions for initialize islands
  - or `//@island` top level file comments
- Lazy loaded components
- Lazy Hydration Modifiers - `//@island lazy`

## Installation

The installation differs based on which plugin you wish to use.

### esbuild

```sh
npm i esbuild @barelyhuman/preact-island-plugins preact
```

### rollup

```sh
npm i rollup preact @barelyhuman/preact-island-plugins @rollup/plugin-babel @rollup/plugin-node
```

if using `typescript`, you should also add that when using `rollup`

```sh
npm i @rollup/plugin-typescript
```

## Usage

```js
// Single Import
const preactIslands = require('@barelyhuman/preact-island-plugins')

preactIslands.rollup(options)
// or
preactIslands.esbuild(options)

// Tree Shakeable Import

// For rollup
const preactIslands = require('@barelyhuman/preact-island-plugins/rollup')

// for esbuild
const preactIslands = require('@barelyhuman/preact-island-plugins/esbuild')
```

Both bundlers use the same Options type, please read through the API options
below to configure the behaviour of the island generation

```ts
export interface Options {
  // The working directory of the project, Defaults to '.'
  rootDir: string
  // If using `atomic` components, use the baseURL to specific the path where the JS Assets will be available
  baseURL: string
  // when true, each island has it's own script for lazy loading JS and Interactivity
  atomic?: boolean
  // If working with bundlers where hashing isn't available, you can set the `hash` to true to get browsers
  //  to load the correct JS after loads
  hash?: boolean
  // The plugins use your bundler (rollup, esbuild, etc) to also bundle the client asset with it's own imports
  // so the `client` options define the behavior for that
  client: {
    // path of where to output the bundled components
    output: string
  }
}
```

#### Concepts

The overall idea is to be able to define islands without thinking about it.

The plugins provide 2 ways to do this.

##### File name extensiom

You name the file `.island.js` or `.island.tsx` and this will generate the
island files for you according to your build configs. Make sure you go through
the [playground](/playground) to better understand this.

##### Top Level comments

The other options is to prefix the code with `//@island` and this is to be done
where you start the file without knowing if it's going to be an islad or not.

This might look, something like this

```js
//@island

export default function Counter() {
  const [count, setCount] = useState(0)
  return <>{count}</>
}
```

##### Lazy Hydration

The islands generated by this plugin is already lazy loaded, so you don't have
to ever set it up and the browser will take care of handling the cache of the
file. Though, we do provide with lazy hydration which can help with performance
where the JS is downloaded earlier but is not applied to the DOM element unless
it's in view.

It would look something like this

```js
//@island lazy

export default function Counter() {
  const [count, setCount] = useState(0)
  return <>{count}</>
}
```

You can also define the threshold of visibility by adding a number from `0` to
`1` to the `lazy` modifier.

- `0` - Hydrate as soon as the element is in view.
- `0.5`(default) - Hydrate after at least 50% of the element is in view
- `1` - Hydrate after the whole element is in view

```js
//@island lazy:0.2
//              ^ hydrate Counter after 20% of the element is in the viewport

export default function Counter() {
  const [count, setCount] = useState(0)
  return <>{count}</>
}
```

### Limitations

- Only allows Single default export to be an island
  [right now](https://github.com/barelyhuman/preact-island-plugins/issues/10)
- Bug with Text based containers
  [#4](https://github.com/barelyhuman/preact-island-plugins/issues/4)

## Example Configurations

```js
// build.js
// for esbuild
const esbuild = require('esbuild')
const preactIslands = require('@barelyhuman/preact-island-plugins/esbuild')

esbuild
  .build({
    entryPoints: ['./server.js'],
    format: 'cjs',
    target: 'node16',
    platform: 'node',
    bundle: true,
    jsx: 'automatic',
    jsxImportSource: 'preact',
    loader: {
      '.js': 'jsx',
    },
    outdir: 'dist',
    plugins: [preactIslands()],
  })
  .then(_ => process.exit(0))
  .catch(_ => process.exit(1))
```

```js
// rollup.config.js
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const { babel } = require('@rollup/plugin-babel')
const preactIslands = require('@barelyhuman/preact-island-plugins/rollup')
const { DEFAULT_EXTENSIONS } = require('@babel/core')
const typescript = require('@rollup/plugin-typescript').default

/**
 * @type {import("rollup").RollupOptions}
 */
module.exports = {
  input: 'server.js',
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  plugins: [
    // helper plugins to handle typescript for the remaining of the server
    typescript({
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
      },
    }),
    preactPlugin(),
    // subset handlers for the remaining of the server to handle jsx
    babel({
      plugins: [
        [
          '@babel/plugin-transform-react-jsx',
          { runtime: 'automatic', importSource: 'preact' },
        ],
      ],
      babelHelpers: 'bundled',
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
    }),
  ],
}
```

## How ?

The source code is pretty small but if it's just the concept behind that you
wish to understand, then please keep reading this.

Islands are normally interactive elements or tiny apps that are mounted on parts
of a static html. This is done to minimize the amount of JS used by the app. A
lot of frameworks come with this already setup for you.

- [Astro.build](http://astro.build/)
- [Deno Fresh](http://fresh.deno.dev/)

There's tiny differences in the implementations that each of us use but the
overall concept remains same. The only difference being you don't have to
migrate your whole app to these frameworks just to enjoy islands or get rid of
let's say something like old JQuery dependencies. I like JQuery but it'll
probably be easier to use something better at handling state today.

You can also be someone who doesn't like frameworks and would prefer working
with their own set of choices / decisions in tech. This is also where something
like this might be helpful.

Overall, it's tiny enough to build your own framework on top off and also shove
it down the structure you already have.

# FAQS

**What on earth in islands?**

- Glad you asked, You can
  [read about it on here](https://barelyhuman.github.io/preact-islands-diy/)

**Who's this library/plugins for?**

- Anyone who wishes to setup the partial hydration on a server framework.
- You could be someone with an express / fastify / hapi server using nunjucks or
  pug and jquery / alpine.js / htmx to add in interactivity.
- You can add this in and use preact islands to add interactivity to your apps
  without thinking about it.

**Examples, please?**

- Sure, you can go through the [playground](/playground) folder to see how to
  use it with esbuild and rollup with an express server. If you an issue setting
  it up still,feel free to raise an issue.

## Contributing

Contributions are welcome! Here's how you can get involved:

1. Fork the project repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them, following the project's code style
   guidelines.
4. Push your changes to your forked repository.
5. Submit a pull request with a description of your changes.

## License

This project is licensed under the [MIT License](/LICENSE).
