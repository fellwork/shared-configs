import { defineConfig } from 'tsup'
import lint from 'esbuild-plugin-eslint'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/core-lint.ts'],
  esbuildPlugins: [lint({ fix: true })],
  external: ['@rushstack/eslint-patch'],
  format: ['cjs'],
})
