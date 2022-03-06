import type { Linter } from 'eslint'

require('@rushstack/eslint-patch/modern-module-resolution')

const config = {
  extends: ['@fellwork/eslint-config-core'],
  overrides: [
    {
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ],
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/ban-ts-comment': [
          'error',
          { 'ts-ignore': 'allow-with-description' },
        ],
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/brace-style': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/comma-dangle': 'off',
        '@typescript-eslint/comma-spacing': 'off',
        '@typescript-eslint/consistent-indexed-object-style': [
          'error',
          'record',
        ],
        '@typescript-eslint/consistent-type-definitions': [
          'error',
          'interface',
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { disallowTypeAnnotations: false, prefer: 'type-imports' },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/func-call-spacing': 'off',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/keyword-spacing': 'off',
        '@typescript-eslint/member-delimiter-style': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-extra-parens': 'off',
        '@typescript-eslint/no-extra-semi': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-redeclare': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-use-before-define': [
          'error',
          { classes: false, functions: false, variables: true },
        ],
        '@typescript-eslint/object-curly-spacing': 'off',
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        '@typescript-eslint/semi': 'off',
        '@typescript-eslint/space-before-blocks': 'off',
        '@typescript-eslint/space-before-function-paren': 'off',
        '@typescript-eslint/space-infix-ops': 'off',
        '@typescript-eslint/type-annotation-spacing': 'off',
        'import/named': 'off',
        'no-redeclare': 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',
        'no-useless-constructor': 'off',
      },
    },
  ],
} as Linter.Config

export = config
