import __esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'
import pkg from './package.json'

const external = ['path', ...Object.keys(pkg.dependencies), /\.json$/]

const esbuild = () =>
  __esbuild({
    target: 'esnext',
    module: 'esnext',
  })

export default [
  {
    external,
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        exports: 'auto',
      },
      {
        file: pkg.module,
        format: 'es',
        exports: 'auto',
      },
    ],
    plugins: [esbuild()],
  },
  {
    input: '.cache/index.d.ts',
    output: {
      file: pkg.types,
      format: 'es',
    },
    plugins: [dts()],
  },
]
