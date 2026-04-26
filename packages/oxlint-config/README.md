# @fellwork/oxlint-config

Shared [oxlint](https://oxc.rs/docs/guide/usage/linter.html) configurations for Fellwork projects.

## Install

```bash
bun add -D -E @fellwork/oxlint-config oxlint
```

## Pick a preset

| Preset | When to use |
|---|---|
| `base` | Generic JS/TS, sensible defaults |
| `node` | Node/Bun backend code |
| `browser` | Frontend apps |
| `lib` | Anything you publish to npm — strictest correctness |

## Quick example

```jsonc
// .oxlintrc.json
{
  "extends": ["@fellwork/oxlint-config/lib"]
}
```

## Composition

Use one preset. If you need to override, add a `rules` block in your local `.oxlintrc.json` after the `extends`.

## License

MIT — see [LICENSE](./LICENSE).
