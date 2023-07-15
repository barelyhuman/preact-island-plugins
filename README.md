# preact-island-plugins

> Bundler plugins to make preact islands a breeze to work with

## Description

The aim of the project is to make it easy for both users and frameworks to be
able to build preact islands by just plugging the functionality into the
bundler.

This allows anyone go be able to create a Server Rendered, Partially hydrated
app without getting locked into a framework

## Features

- Bundler plugins for Rollup, ESBuild, Webpack(Soon)
- Works with preact (duh.)
- Easy island declarations
  - File based `.island.js`
  - Comment Based `//@island`

## Installation

```sh
npm i @barelyhuman/preact-island-plugins
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

Both bundlers use the same Options type

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
