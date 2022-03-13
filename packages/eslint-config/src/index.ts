import eslint from './rules/eslint'
import node from './rules/node'

export = {
  env: {},
  extends: [],
  ignorePatterns: ['**/*.d.ts', '**/dist'],
  overrides: [
    {
      extends: [eslint, node],
      files: ['*.[jt]s?(x)'],
    },
  ],
}
