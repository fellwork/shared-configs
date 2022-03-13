module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'add',
        'breaking',
        'build',
        'chore',
        'chore-deps',
        'chore-release',
        'ci',
        'config',
        'docs',
        'feat',
        'fix',
        'i18n',
        'perf',
        'refactor',
        'release',
        'remove',
        'revert',
        'security',
        'style',
        'test',
      ],
    ],
  },
}