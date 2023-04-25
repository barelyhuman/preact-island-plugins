# @barelyhuman/preact-island-plugins

> Collection of plugins for different bundlers to treat `.island.js` files as
> preact islands

> **Note**: This is being built for personal use, and might change the API and
> functionality as needed, would recommend forking it and using that instead.

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
