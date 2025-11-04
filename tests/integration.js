const { test } = require('uvu')
const assert = require('uvu/assert')
const { execSync } = require('child_process')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { rmdir, rm, access } = require('fs/promises')

test.before.each(async () => {
  const toRemove = [
    join(__dirname, '../examples/simple-express/dist'),
    join(__dirname, '../playground/dist'),
  ]

  for (let filepath of toRemove) {
    const exists = await access(filepath)
      .then(() => true)
      .catch(() => false)
    if (!exists) continue
    await rm(filepath, { recursive: true })
  }

  process.chdir(join(__dirname, '..'))
})

test('integration - playground builds successfully', async () => {
  // Change to playground directory
  process.chdir(join(__dirname, '../playground'))

  // Install dependencies
  execSync('pnpm install', { stdio: 'inherit' })

  // Build with esbuild
  execSync('npm run build:esbuild', { stdio: 'inherit' })

  // Check that client files were generated
  const clientDir = join(__dirname, '../playground/dist/client')
  if (!existsSync(clientDir)) {
    throw new Error('Client directory not created')
  }

  // Check that island files exist
  const counterIsland = join(clientDir, 'Counter.js')
  const counterTSIsland = join(clientDir, 'CounterTS.js')

  if (!existsSync(counterIsland)) {
    throw new Error('Counter island not generated')
  }

  if (!existsSync(counterTSIsland)) {
    throw new Error('CounterTS island not generated')
  }

  // Verify the generated client code contains expected content
  const counterCode = readFileSync(counterIsland, 'utf8')
  if (!counterCode.includes('customElements.define("island-counter"')) {
    throw new Error('Counter island client code is malformed')
  }

  const counterTSCcode = readFileSync(counterTSIsland, 'utf8')
  if (!counterTSCcode.includes('customElements.define("island-counter-t-s"')) {
    throw new Error('CounterTS island client code is malformed')
  }

  console.log('✓ Playground integration test passed')
  assert.ok(true)
})

test('integration - playground builds successfully with rollup', async () => {
  // Change to playground directory
  process.chdir(join(__dirname, '../playground'))
  // Install dependencies
  execSync('pnpm install', { stdio: 'inherit' })

  // Build with rollup
  execSync('pnpm build:rollup', { stdio: 'inherit' })

  // Check that client files were generated
  const clientDir = join(__dirname, '../playground/dist/client')
  if (!existsSync(clientDir)) {
    throw new Error('Client directory not created')
  }

  // Check that island files exist
  const containerIsland = join(clientDir, 'Container.js')
  const textIsland = join(clientDir, 'TextIsland.js')

  if (!existsSync(containerIsland)) {
    throw new Error('Container island not generated')
  }

  if (!existsSync(textIsland)) {
    throw new Error('Text island not generated')
  }

  // Verify the generated client code contains expected content
  const containerCode = readFileSync(containerIsland, 'utf8')
  if (!containerCode.includes('customElements.define("island-container"')) {
    throw new Error('Container island client code is malformed')
  }

  const textIslandCode = readFileSync(textIsland, 'utf8')
  if (!textIslandCode.includes('customElements.define("island-text-island"')) {
    throw new Error('CounterTS island client code is malformed')
  }

  console.log('✓ Playground rollup integration test passed')
})

test('integration - simple-express example builds successfully', async () => {
  // Change to example directory
  process.chdir(join(__dirname, '../examples/simple-express'))

  // Install dependencies
  execSync('pnpm install', { stdio: 'inherit' })

  // Build the example
  execSync('npm run build', { stdio: 'inherit' })

  // Check that dist directory was created
  const distDir = join(__dirname, '../examples/simple-express/dist')
  if (!existsSync(distDir)) {
    throw new Error('Dist directory not created')
  }

  // Check that app.js exists
  const appFile = join(distDir, 'app.js')
  if (!existsSync(appFile)) {
    throw new Error('App file not built')
  }

  console.log('✓ Simple-express integration test passed')
})

test.run()
