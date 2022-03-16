const gulp = require('gulp')
const builder = require('@fellwork/builder/gulp')
// const { dependencies } = require('./package.json')

exports.clean = builder.clean(['./dist', '*.tsbuildinfo'])

exports.esmBuild = builder.bundle.bundle('esm')

exports.cjsBuild = builder.bundle.bundle('cjs')

exports.default = gulp.series(
  exports.clean,
  exports.cjsBuild,
  exports.esmBuild,

  builder.packageJson.packageJson(
    {
      directories: {
        lib: './',
      },
      files: ['**/*.js', 'rules.d.ts', 'rules/**/rules/*.d.ts'],
      main: './index.js',
      module: undefined,
    },
    {
      exports: undefined,
    },
  ),
  // builder.copy(['./README*', './LICENSE*', './src/**/package.json'], './ dist'),
)
