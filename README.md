# fellwork/shared-configs

Canonical home for shared developer configs across the Fellwork ecosystem.

Companion repo: **[fellwork/foreman](https://github.com/fellwork/foreman)** (the scaffolder that consumes shared-configs).

## What lives here

Three categories of artifact:

1. **Published npm packages** under the `@fellwork/*` scope (in [`packages/`](./packages/)).
2. **Template files** copied into repos by foreman (in [`templates/`](./templates/)).
3. **Reusable GitHub Actions workflows** consumed by `uses:` ref (in [`.github/workflows/`](./.github/workflows/)).

Plus **[`kinds/`](./kinds/)** — repo-type manifests that describe which packages, templates, and workflows belong to each kind of repo. This is the integration layer foreman reads.

## Toolchain

- **bun** — runtime, package manager, publisher
- **biome** — formats and lints this repo
- **changesets** — independent versioning per package
- **moon** — task orchestrator
- **proto** — pinned tool versions (see [`.prototools`](./.prototools))
- **GitHub Actions** — CI + release with npm trusted publishing (OIDC)

## Local development

Install [proto](https://moonrepo.dev/proto), then:

```bash
proto use
bun install
moon run :ci
```

## Docs

- [Design spec](./docs/superpowers/specs/2026-04-26-fellwork-shared-configs-design.md) — full design, decisions log
- [Implementation plan](./docs/superpowers/plans/2026-04-26-shared-configs-v0.md) — phase-by-phase build plan

## License

MIT — see [LICENSE](./LICENSE).
