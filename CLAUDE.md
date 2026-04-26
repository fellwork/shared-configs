# shared-configs

Canonical home for shared developer configs across the Fellwork ecosystem.

## Commands

```bash
bun install                # install dependencies
moon run :ci               # full CI pipeline (check + test)
bun run changeset          # add a changeset for the current change
bunx changeset status      # see what's queued for release
```

## Layout

- `packages/` — published @fellwork/* packages
- `templates/` — file-copy assets consumed by foreman
- `kinds/` — repo-type manifests (the integration keystone)
- `.github/workflows/` — reusable workflows consumed by ref
- `.github/actions/` — composite actions
- `tools/` — repo-shape verifier + kind-manifest validator
- `docs/superpowers/specs/` — design docs

## Conventions

- **Commits:** Conventional Commits per `@fellwork/commitlint-config`. Allowed types: add, breaking, build, chore, chore-deps, chore-release, ci, config, docs, feat, fix, i18n, perf, refactor, release, remove, revert, security, style, test.
- **Format / lint:** biome (formatter + core lints), oxlint (broad correctness sweep). The repo dogfoods @fellwork/biome-config from packages/biome-config.
- **TypeScript:** root tsconfig.json extends @fellwork/tsconfig/node.
- **Releases:** changesets-driven, npm trusted publishing (OIDC). No NPM_TOKEN secret. See docs/superpowers/specs/2026-04-26-fellwork-shared-configs-design.md §5.

## Skill routing

- Bugs, errors → `investigate`
- Ship, deploy, PR → `ship`
- Code review → `review`
