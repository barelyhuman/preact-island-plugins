# @barelyhuman/preact-island-plugins

> Collection of plugins for different bundlers to treat `.island.js` files as
> preact islands

> **Note**: This is being built for personal use, and might change the API and
> functionality as needed, would recommend forking it and using that instead.

> **Warning**: This is a low level plugin written to build upon for writing
> frameworks or being used in a boilerplate that handles the paths and entries
> for the specified bundler. The plugin's work is just to generate island
> components for you.

## Usage

The repo comes with 3 plugins for different bundlers and these serve as the
connecting ground for generating island code for you.

The output can then be used in either `atomic` or non-atomic manner to serve a
MPA style website.

Since each bundler has a different way of setting itself up, please refer to the
[ `examples` ](/examples/) directory for a setup that you might wanna use.

We recommend the **esbuild** one as it's the simplest one out of the bunch.

To understand more about these plugins and the work that they are trying to
reduce for you, refer to the original DIY repo for preact islands.

[barelyhuman/preact-islands-diy](https://github.com/barelyhuman/preact-islands-diy)

While these are built for preact, the plugin(s) can be forked to replace and
create similar islands for other web libraries.

## Current Limitations

- An island cannot render another island. Workaround: You can move the islands
  up to server rendered component and combine them there instead.

## Documentation / Reference

### Installation

The plugins can be installed with the npm package
`@barelyhuman/preact-island-plugins`

```sh
yarn add -D @barelyhuman/preact-island-plugins
# or
npm i -D @barelyhuman/preact-island-plugins
```

### Imports

```js
// you could import all of them this way, if working with CJS or older
// node versions
import plugins from '@barelyhuman/preact-island-plugins'
const { vite, rollup, esbuild } = plugins

// or

import esbuildIslandPlugin from '@barelyhuman/preact-island-plugins/esbuild'
import viteIslandPlugin from '@barelyhuman/preact-island-plugins/vite'
import rollupIslandPlugin from '@barelyhuman/preact-island-plugins/rollup'
```

### API

All plugins share the same set of options

```tsx
type Options = {
  // the cwd decides where the preact plugins will generate the island
  // clients and other generative files. So if you wish for the output of
  // the plugin to be in `dist` this would point to "dist"
  cwd: string,

  // Atomic, if true would generate the islands with their own injection, and mounting
  // scripts and if false would just generate the island custom web component that
  // you can then control on how to inject into your client app.
  atomic: boolean,

  // baseURL only needs to be set if `atomic:true`, this is a string that is passed so that
  // the script knows where it's assets will be stored.
  // ex: if I set the baseURL as `/public` then my islands are generated with a `<script src="/public/island-file.js" />`
  // to handle this url, your server should alias your assets to the `/public` url or you can change this baseURL to whatever
  // your server already uses as the static asset path.
  //-------------------------------------------------------
  // NOTE: Preact Island Plugins is not responsible for moving the file to your asset directory, you'll have to do
  // this in the build script
  //-------------------------------------------------------
  baseURL: string,

  // hashing will generate island files with their names hashed if there's been a change in the data, this is done
  // to force certain browsers to refetch the script, both useful during development and production when new features
  // were added but aren't reflected due to a cached version of the script.
  hash: boolean,
})
```

### Internals

- TBD

# Goals

- [x] Support JS
- [ ] Support TS
  - [x] esbuild
- [ ] Bundlers
  - [ ] Webpack
  - [x] esbuild
  - [x] rollup
  - [x] vite
- [ ] Make it faster
- [ ] Tests (loads of them)
