import { defineConfig } from 'tsup'
import lint from 'esbuild-plugin-eslint'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  esbuildPlugins: [lint({ fix: true }), nodeExternalsPlugin()],
  format: ['cjs'],
  splitting: false,
})
