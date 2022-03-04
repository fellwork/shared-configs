import type { RollupOptions } from 'rollup'
import json from '@rollup/plugin-json'
import { resolve } from 'node:path'
import { version } from './package.json'

const libName = '@fellwork/eslint-config-core'

async function makeBanner() {
  const date = new Date(Date.now()).toUTCString()
}

const config: RollupOptions = {
  input: 'src/index.ts',
  output: [],
}

export default config
