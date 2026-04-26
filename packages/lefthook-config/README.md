# @fellwork/lefthook-config

Shared [lefthook](https://github.com/evilmartians/lefthook) git hooks for Fellwork projects.

## Use

```yaml
# lefthook.yml
remote:
  url: https://github.com/fellwork/shared-configs
  configs:
    - packages/lefthook-config/lefthook.yml
```

Or copy `lefthook.yml` directly via foreman scaffold.

## Hooks

- **pre-commit:** biome write + oxlint (parallel)
- **commit-msg:** commitlint
- **pre-push:** TypeScript typecheck

## License

MIT
