# Fellwork shared-configs — design spec

**Status:** approved (2026-04-26)
**Author:** Shane McGuirt
**Companion repos:** `fellwork/foreman` (scaffolder consumer), `fellwork/api` (first real adopter)

---

## 1. Mission & scope

`fellwork/shared-configs` is the canonical home for every shared developer
configuration in the Fellwork ecosystem and the source of truth that
`fellwork/foreman` (the scaffolder) consumes.

It owns three categories of artifact:

1. **Published npm packages** under the `@fellwork/*` scope — consumed by
   `extends:` / `peerDependencies:` / `package.json` and bumped per-repo by
   Renovate.
2. **Template files** copied into new and existing repos by foreman — for
   things that cannot ship through npm (Rust configs, dotfiles,
   community-health files, `CLAUDE.md`).
3. **Reusable GitHub Actions workflows and composite actions** — consumed by
   `uses: fellwork/shared-configs/.github/workflows/...@<tag>` and never
   copied into consumer repos.

It does **not** own the scaffolder (that is `fellwork/foreman`) or any
application code. It is config-only.

### Two existing repos fold in

- `fellwork/tsconfig` → `shared-configs/packages/tsconfig/` (deprecate the
  standalone repo; keep publishing `@fellwork/tsconfig` from the new home).
- `fellwork/lint` → its `@fellwork/biome-config` becomes
  `shared-configs/packages/biome-config/` (deprecate the standalone repo).

### Out of scope for v0

- Any package not on the agreed roster (see §3).
- Non-Fellwork consumers.
- Languages beyond TypeScript and Rust (no Python, Go, etc.).

---

## 2. Architecture

```
shared-configs/
├── packages/                  ← published to npm as @fellwork/*
│   ├── tsconfig/              folded from fellwork/tsconfig
│   ├── biome-config/          folded from fellwork/lint
│   ├── oxlint-config/         new
│   ├── commitlint-config/     new
│   ├── release-config/        new (bumpp + changelog presets)
│   ├── renovate-config/       new
│   ├── markdownlint-config/   new
│   ├── cspell-config/         new
│   └── lefthook-config/       new
│
├── templates/                 ← file-copy via foreman, NOT published
│   ├── community-health/      LICENSE, SECURITY.md, CoC, CONTRIBUTING.md,
│   │                          .github/{ISSUE,PULL_REQUEST}_TEMPLATE/,
│   │                          CODEOWNERS
│   ├── editorconfig
│   ├── gitattributes
│   ├── gitignore/             per-kind: node, rust, polyglot
│   ├── vscode/                settings.json, extensions.json
│   ├── claude/                CLAUDE.md.tmpl + .claude/ scaffold
│   ├── rust/                  clippy.toml, rustfmt.toml, deny.toml,
│   │                          .cargo/config.toml, rust-toolchain.toml,
│   │                          .fw-domain-lint.toml
│   ├── bunfig.toml
│   ├── dependabot.yml
│   ├── fly.toml.tmpl
│   └── README.md.tmpl
│
├── kinds/                     ← repo-type manifests (the design keystone)
│   ├── ts-library.yaml
│   ├── ts-application.yaml
│   ├── nuxt-app.yaml
│   ├── rust-workspace.yaml
│   ├── rust-library.yaml
│   └── polyglot.yaml
│
├── .github/
│   ├── workflows/             ← reusable workflows, consumed by ref
│   │   ├── ts-ci.yml
│   │   ├── rust-ci.yml
│   │   ├── npm-release.yml
│   │   ├── cargo-publish.yml
│   │   ├── semver-label-check.yml
│   │   └── verify-repo-shape.yml
│   └── actions/               ← composite actions, consumed by ref
│       ├── setup-bun-biome/
│       ├── setup-rust-toolchain/
│       └── extract-semver-label/
│
├── tools/
│   ├── verify-repo-shape.ts   ← runs in consumer-repo CI
│   └── fixtures/              ← integration fixtures per package
│
├── docs/
│   ├── kinds.md
│   ├── packages.md
│   ├── templates.md
│   ├── workflows.md
│   ├── adopting.md
│   └── superpowers/specs/
│
├── .changeset/
├── biome.json                 ← shared-configs uses its own configs
├── tsconfig.json              ← extends @fellwork/tsconfig
├── package.json
├── bun.lock
└── README.md
```

### Toolchain

Matches what `fellwork/lint` already uses (the most modern of the existing
repos):

- **bun** — runtime, package manager, publisher
- **biome** — formats and lints `shared-configs` itself
- **changesets** — version + changelog management
- **moon** — task orchestrator
- **proto** — pinned tool versions
- **GitHub Actions** — CI + release pipeline

---

## 3. The `kinds/` manifest (design keystone)

A repo *kind* is the integration layer foreman reads. Each manifest names
which packages, templates, and workflows belong to that kind of repo. New
kinds are added by writing one YAML file, not by editing foreman.

### Initial kinds for v0

- `ts-library` — TS package published to npm
- `ts-application` — TS app, no publish (foreman, scribe, bootstrap)
- `nuxt-app` — frontend (web)
- `rust-workspace` — multi-crate Cargo workspace, optional Fly deploy (api)
- `rust-library` — single-crate Cargo lib published to crates.io
- `polyglot` — TS + Rust in one repo

### Example manifest

```yaml
# kinds/ts-library.yaml
kind: ts-library
description: A TypeScript library published to npm
extends: ts-base

packages:
  devDependencies:
    - "@fellwork/tsconfig"
    - "@fellwork/biome-config"
    - "@fellwork/oxlint-config"
    - "@fellwork/commitlint-config"
    - "@fellwork/release-config"
    - "@fellwork/lefthook-config"
    - "changesets"
    - "bumpp"
  peerDependencies:
    - { name: "typescript", version: ">=5.5.0" }

templates:
  - community-health/
  - editorconfig
  - gitattributes
  - gitignore/node
  - vscode/
  - claude/
  - bunfig.toml
  - README.md.tmpl@ts-library
  - dependabot.yml

tsconfig:
  extends: ["@fellwork/tsconfig/node", "@fellwork/tsconfig/library"]
  include: ["src/**/*.ts"]

workflows:
  - ts-ci.yml@v1
  - npm-release.yml@v1
  - semver-label-check.yml@v1
  - verify-repo-shape.yml@v1

renovate:
  extends: "@fellwork/renovate-config"

scripts:
  build: "bun run scripts/build.ts"
  test: "bun test"
  lint: "biome check . && oxlint ."
```

### Manifest schema (informal)

Each manifest may include the following top-level keys. Foreman validates
against a JSON Schema published in `kinds/_schema.json`.

| Key | Purpose |
|---|---|
| `kind` | Identifier, must match filename |
| `description` | Human-readable one-liner |
| `extends` | Optional parent manifest (composition; later wins) |
| `packages.devDependencies` | npm devDeps to add |
| `packages.peerDependencies` | npm peerDeps to add (with version ranges) |
| `templates` | Template paths to copy (relative to `templates/`) |
| `tsconfig.extends` / `tsconfig.include` | tsconfig.json shape (TS kinds only) |
| `cargo` | Cargo.toml shape (Rust kinds only) |
| `workflows` | Reusable workflows to wire into `.github/workflows/` |
| `renovate.extends` | Renovate preset to inherit |
| `scripts` | npm scripts to add to package.json |

---

## 4. Distribution mechanisms

| Asset type | Mechanism | Versioning | Update path |
|---|---|---|---|
| **JS/TS configs** (tsconfig, biome, oxlint, commitlint, release, renovate, markdownlint, cspell, lefthook) | npm publish | Independent semver via Changesets | Renovate per consumer repo |
| **Rust configs** (clippy.toml, rustfmt.toml, deny.toml, .cargo/config.toml, rust-toolchain.toml) | File-copy via foreman + optional `foreman sync` | Frozen at scaffold time | `foreman sync` re-applies template diffs (Cruft model) |
| **`.fw-domain-lint.toml`** | File-copy *plus* CI git-fetch at a pinned tag | Tag (e.g. `domain-lint-v3`) | Renovate bumps the tag in consumer's CI workflow |
| **Reusable GitHub workflows** | `uses: fellwork/shared-configs/.github/workflows/x.yml@v1` | Major-version git tags | Consumer pins tag; Renovate's GitHub Actions manager bumps it |
| **Composite actions** | `uses:` ref | Major tags | Renovate |
| **Community-health files** | File-copy via foreman | Frozen at scaffold | `foreman sync` |
| **CLAUDE.md / .claude/** | File-copy with placeholder substitution | Frozen at scaffold | `foreman sync` (preserves user-edited sections) |
| **Repo-shape verifier** | Script in `tools/verify-repo-shape.ts`, invoked by `verify-repo-shape.yml` reusable workflow (no npm package; runs via `bunx` from the workflow) | Pinned by workflow's `@v1` tag | Renovate bumps the workflow tag |

**Why the hybrid:** the research surveyed in the brainstorming session shows
this is what mature orgs converge on. npm for what npm distributes well,
files for what it does not (Rust), git-fetch only where instant propagation
matters (`.fw-domain-lint.toml`).

---

## 5. Versioning, release, and CI

### Versioning model

**Independent semver per package via Changesets.** Each PR that changes a
package adds a `.changeset/<name>.md` entry. Merging triggers
`changesets/action`, which either opens a "Version Packages" PR or publishes
when that PR is merged.

**Reusable workflows are tagged separately** with major-version git tags
(`@v1`, `@v2`) maintained as moving refs. A `tag-workflows.yml` workflow
moves the major tag forward when workflow files change in a
backward-compatible way.

**Templates are released with the repo** — there is no per-template version.
Foreman pins the *commit SHA or tag* of `shared-configs` it scaffolded from
in a `.foreman.lock` file in the consumer repo. `foreman sync` reads that
and computes the diff.

### CI pipeline (on shared-configs itself)

1. **`verify.yml`** — biome check, oxlint, fixture tests for each package,
   schema validation for kind manifests, CLAUDE.md template validation,
   broken-link check on docs.
2. **`release.yml`** — Changesets-driven npm publish on merge to main.
3. **`tag-workflows.yml`** — moves `@v1` / `@v2` major tags forward when
   reusable workflows change.

### Branch protection on `main`

- Require `verify` to pass before merging
- Require 1 review
- Require all conversations resolved
- Disallow direct pushes — all changes via PR

### Publishing model — npm trusted publishing (OIDC)

All CI publishes use **npm trusted publishing**. No long-lived `NPM_TOKEN`
secret lives in any GitHub Actions workflow — neither in `shared-configs`
nor in downstream consumer repos.

The reusable `npm-release.yml` workflow declares
`permissions: id-token: write` and the npm CLI (≥ 11.5.1) exchanges the
short-lived OIDC token for a one-time publish credential at publish time.
The workflow is strictly OIDC-only and does not accept an `NPM_TOKEN`
secret as input — any edge case requiring token-based publishing forks the
workflow rather than complicating the shared one.

Each `@fellwork/*` package must be registered as a trusted publisher on
npmjs.com (per-package, not scope-wide), naming the consuming repo and the
workflow path. For `shared-configs`'s own 9 packages, that registration
points at `fellwork/shared-configs` + `release.yml`. For a TS library
scaffolded by foreman, it points at the consumer's repo + its
`release.yml`.

### First-publish bootstrap

Trusted publishing requires the package to already exist on npmjs.com — a
brand-new package name cannot be OIDC-published. For each new package's
*first* publish:

1. Pull a short-lived **granular access token** from npmjs.com (scoped to
   the package, ~24h expiry).
2. Write it to a local `.env` (gitignored — never committed).
3. Publish from the maintainer's laptop using that token.
4. Configure the package as a trusted publisher on npmjs.com (specify
   `fellwork/<repo>` + workflow path).
5. Discard the local token (let it expire or revoke on npmjs.com).

All subsequent publishes go through CI via OIDC. No persistent
`NPM_TOKEN` secret exists in any repo at any point.

### Foreman scaffolding implication

When foreman scaffolds a `ts-library` (or any kind that publishes to npm),
the generated README includes a "first release" section walking the
maintainer through the bootstrap above. The scaffolded repo has **no**
"set `NPM_TOKEN` secret" step in its setup docs, and **no** `NPM_TOKEN`
field referenced in any of its workflows.

### Dogfooding

`shared-configs` uses its own configs. Its own CI runs the same
`ts-ci.yml` workflow it ships, and `verify-repo-shape.ts` is run against
`shared-configs` itself to prove the verifier works on a real repo.

---

## 6. Consumer integration

### Example A — A new TS library

```bash
foreman new scribe-utils --kind=ts-library
cd scribe-utils
bun install
git init && git add . && git commit -m "feat: scaffold from shared-configs@<sha>"
gh repo create fellwork/scribe-utils --public --source=. --push
```

What lands:

- `package.json` with `@fellwork/{tsconfig,biome-config,oxlint-config,commitlint-config,release-config,lefthook-config}` as devDeps.
- `tsconfig.json` extending `@fellwork/tsconfig/node` + `@fellwork/tsconfig/library`.
- `biome.json` extending `@fellwork/biome-config/lib`.
- `.oxlintrc.json` extending `@fellwork/oxlint-config/lib`.
- `.github/workflows/ci.yml` with `uses: fellwork/shared-configs/.github/workflows/ts-ci.yml@v1`.
- `.github/workflows/release.yml` with `uses: fellwork/shared-configs/.github/workflows/npm-release.yml@v1`.
- `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CODEOWNERS`, `.editorconfig`, `.gitattributes`, `.gitignore`, `.vscode/`, `.claude/`, `CLAUDE.md`, `bunfig.toml`, `README.md`.
- `renovate.json` extending `@fellwork/renovate-config`.
- `.foreman.lock` recording shared-configs SHA + kind.

### Example B — Adopting an existing repo (`fellwork/api`)

```bash
cd c:/git/fellwork/api
foreman adopt --kind=rust-workspace --dry-run
# review the diff
foreman adopt --kind=rust-workspace
```

`foreman adopt` is conservative: it only writes files that do not exist, and
emits a report of files that would conflict (so api's existing `clippy.toml`
is not silently overwritten). After review, the user runs
`foreman adopt --force <files>` for the ones they want to take.

### Example C — Updating an already-scaffolded repo

Three months after scaffolding, `shared-configs` has tightened
`clippy.toml`. The consumer runs:

```bash
foreman sync
```

Foreman reads `.foreman.lock`, fetches `shared-configs` at the new HEAD,
computes the diff between scaffold-time and now, and applies it as a patch
(failing or prompting on user-edited lines, like `cruft update`).

The *implementation* of `foreman sync` belongs to foreman, not
`shared-configs`. But `shared-configs` has to expose its templates so
diffing is tractable — which is why templates are plain files and kind
manifests are declarative.

---

## 7. Migration path & rollout

Each phase is landable independently.

### Phase 0 — Reset the scaffold

Delete the old `packages/{release-config,shared,tsconfig}` stubs in
`shared-configs`. Replace `package.json` / `pnpm-workspace.yaml` (pnpm 6,
babel, husky) with the bun + biome + changesets stack from `fellwork/lint`.
Add `.changeset/`, `biome.json`, `tsconfig.json` (extending nothing yet —
wired up in Phase 1).

### Phase 1 — Fold in `tsconfig`

Move `fellwork/tsconfig`'s contents to `shared-configs/packages/tsconfig/`.
Verify the existing tsconfig design doc still applies. Set up the publish
pipeline. Cut a release. Add a deprecation README to `fellwork/tsconfig`
pointing at the new home, but keep publishing `@fellwork/tsconfig` from the
new location at the same name.

### Phase 2 — Fold in `biome-config`

Same as Phase 1 for `fellwork/lint`'s `@fellwork/biome-config`.

### Phase 3 — Build the missing JS packages

`oxlint-config`, `commitlint-config`, `release-config`, `renovate-config`,
`markdownlint-config`, `cspell-config`, `lefthook-config`. Each gets its
own changeset and is published.

### Phase 4 — Build the templates directory

Community-health files, editorconfig, gitattributes, gitignore, vscode,
bunfig, dependabot, fly.toml.tmpl, README.md.tmpl, claude/. No npm publish
for any of these.

### Phase 5 — Build the Rust template directory

Including the migration of `.fw-domain-lint.toml` from `fellwork-ops` to
`shared-configs/templates/rust/`. Update `fellwork/api`'s CI to fetch from
the new location at a pinned tag. Update `fellwork-ops` to remove the old
copy or point at the new home.

### Phase 6 — Build the reusable workflows + composite actions

Tag as `@v1`. Test by adopting them in `shared-configs`'s own CI first.

### Phase 7 — Build the kind manifests + repo-shape verifier

Write `kinds/*.yaml` for all six kinds. Write `tools/verify-repo-shape.ts`.
Add a fixture suite that scaffolds each kind into a temp directory and
asserts the shape.

### Phase 8 — Adopt in `fellwork/api`

First real consumer. Use `foreman adopt --kind=rust-workspace` once foreman
supports it (or do it by hand if foreman is not ready). Validates the
design end-to-end against the most complex repo.

### Phase 9 — Adopt in remaining repos

`web`, `bootstrap`, `scribe`, `ops`, `foreman` itself. Each adoption is a
separate PR.

### Phase 10 — Deprecate `fellwork/tsconfig` and `fellwork/lint` repos

Archive on GitHub. Add redirect README pointing to `shared-configs`.

---

## Appendix A — Decisions log

| # | Decision | Rationale |
|---|---|---|
| 1 | Hybrid distribution (npm + file-copy + git-fetch) | Matches what mature orgs converge on; each mechanism fits the asset type |
| 2 | Independent versioning via Changesets | Packages are not tightly coupled; Renovate handles per-repo bumps cleanly |
| 3 | bun + biome + moon + proto + changesets toolchain | Inherits from `fellwork/lint`'s already-modern stack; avoids two toolchains |
| 4 | `kinds/` manifests as the integration keystone | Without them, foreman becomes a flag soup. With them, new kinds are one YAML file |
| 5 | Reusable workflows consumed by `uses:` ref, not copied | GitHub-blessed pattern since 2021; eliminates workflow drift across repos |
| 6 | `.fw-domain-lint.toml` moves from fellwork-ops to shared-configs | Resolves the "shared-configs did not exist" comment in api's CLAUDE.md |
| 7 | `foreman sync` capability is v0, not v2 | Research showed the update story is what separates real platforms from one-shot scaffolders |
| 8 | Templates are plain files with placeholder substitution, not a templating engine | Diffs cleanly for `foreman sync`; engines like Handlebars make diffs untractable |
| 9 | Major-tag pinning for reusable workflows (`@v1`, `@v2`) | Industry standard; lets consumers opt into breaking changes |
| 10 | npm trusted publishing (OIDC) for all CI publishes; no `NPM_TOKEN` secret anywhere | Eliminates leaked-token blast radius; every publish credential is short-lived and one-time-use |
| 11 | First-publish bootstrap uses a local granular token in `.env` (laptop only, never CI) | Trusted publishing requires the package to exist on npmjs.com first; the bootstrap is the only time a token is held, and it lives outside CI |
| 12 | Reusable `npm-release.yml` is strictly OIDC-only, no `NPM_TOKEN` input | Forces consumer repos onto the secure path; edge cases fork the workflow rather than weakening the shared one |

---

## Appendix B — Open questions deferred to implementation

These are intentionally not decided in the spec; the writing-plans phase or
implementation will resolve them.

- **Placeholder substitution syntax in templates** — `${var}` vs.
  `{{var}}` vs. mustache-lite. Pick one in the foreman implementation; the
  spec just requires it be diff-friendly.
- **`.foreman.lock` schema** — owned by foreman; `shared-configs` only
  needs to expose stable SHA / tag refs that foreman can pin against.
- **Changesets release notes formatting** — defaults are fine; revisit if
  the changelog gets noisy.
- **Whether `kinds/_schema.json` lives in shared-configs or foreman** —
  defaulting to shared-configs (it describes shared-configs's own data
  shape), but foreman's parser may want a typed version too.
