import { defineConfig } from 'tsup'
import lint from 'esbuild-plugin-eslint'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  esbuildPlugins: [lint({ fix: true })],
  format: ['cjs', 'esm'],
})
