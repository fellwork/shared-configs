# @fellwork/renovate-config

Shared [Renovate](https://docs.renovatebot.com/) preset for Fellwork projects.

## Use

```jsonc
// renovate.json
{ "extends": ["@fellwork/renovate-config"] }
```

## What it does

- Conventional commits with `chore-deps:` for dependency updates
- Dependency dashboard
- Lock file maintenance weekly (auto-merge)
- Auto-merge minor/patch for >=1.0 deps and dev deps
- Weekend schedule
- Groups GitHub Actions updates
- Tags vulnerability PRs with `security` label

## License

MIT
