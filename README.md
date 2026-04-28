# fellwork/shared-configs

Canonical home for shared developer configs across the Fellwork ecosystem.

Companion repo: **[fellwork/foreman](https://github.com/fellwork/foreman)** (the scaffolder that consumes shared-configs).

## What lives here

Three categories of artifact:

1. **Published npm packages** under the `@fellwork/*` scope (in [`packages/`](./packages/)).
2. **Template files** copied into repos by foreman (in [`templates/`](./templates/)).
3. **Reusable GitHub Actions workflows** consumed by `uses:` ref (in [`.github/workflows/`](./.github/workflows/)).

Plus **[`kinds/`](./kinds/)** — repo-type manifests that describe which packages, templates, and workflows belong to each kind of repo. This is the integration layer foreman reads.

## Umbrella API

This repo also publishes itself as `@fellwork/shared-configs` — an umbrella
npm package consumed by [foreman](https://github.com/fellwork/foreman). It
exports a small library API for reading kind manifests, resolving template
paths, and validating manifests against the JSON schema.

```ts
import {
  loadKind,
  listKinds,
  templatePath,
  listTemplates,
  manifestSchema,
  type KindManifest,
} from '@fellwork/shared-configs'

const kinds = listKinds()                    // ['nuxt-app', 'polyglot', ...]
const m = loadKind('ts-library')             // KindManifest
const tmpl = templatePath('README.md.tmpl') // absolute path on disk
```

The package ships `dist/` (built TypeScript), `kinds/` (raw YAML), and
`templates/` (raw template files). Adjacent `*.tmpl.types.ts` files are
excluded from the published payload — they exist for compile-time
type-checking inside foreman.

### Kind manifest schema (v1)

In addition to the fields documented in `kinds/_schema.json`, v1 adds four
optional fields foreman consumes:

| Field | Purpose |
|---|---|
| `target` | Where this kind can be created (`repo`, `package`, or both) |
| `context` | Template variables foreman provides (required + optional) |
| `hooks` | Lifecycle commands run after `init`/`sync` |
| `packagePaths` | For monorepo kinds: where in-repo packages can live |

All four are optional and additive — existing manifests stay valid.

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
