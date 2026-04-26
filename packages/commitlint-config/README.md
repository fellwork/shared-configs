# @fellwork/commitlint-config

Shared [commitlint](https://commitlint.js.org/) configuration for Fellwork projects. Extends `@commitlint/config-conventional` with Fellwork's expanded type list.

## Install

```bash
bun add -D -E @fellwork/commitlint-config @commitlint/cli @commitlint/config-conventional
```

## Use

```javascript
// commitlint.config.js
export { default } from '@fellwork/commitlint-config'
```

## Allowed types

`add`, `breaking`, `build`, `chore`, `chore-deps`, `chore-release`, `ci`, `config`, `docs`, `feat`, `fix`, `i18n`, `perf`, `refactor`, `release`, `remove`, `revert`, `security`, `style`, `test`.

## License

MIT
