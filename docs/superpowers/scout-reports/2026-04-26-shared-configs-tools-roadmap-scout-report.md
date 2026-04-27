# Scout Report: shared-configs tools roadmap

Survey for the Architect designing the next phase of `shared-configs/tools/`.
Read-only across the 9 in-scope repos. External research capped at ~15 min.

---

## 1. What exists today (in shared-configs/tools/)

### Layout

```
c:/git/fellwork/shared-configs/tools/
├── moon.yml                       # task wiring (check, test, validate-kinds, ci)
├── tsconfig.json                  # extends @fellwork/tsconfig/node, types: ["@types/bun"]
├── verify-repo-shape.ts           # 145 lines, 4661 bytes, +x
├── verify-repo-shape.test.ts      # bun:test, spawns the script in tmp dirs
├── validate-kinds.ts              # 72 lines, 2391 bytes, +x
├── validate-kinds.test.ts         # bun:test, spawns the validator
└── fixtures/
    └── .gitkeep                   # empty placeholder
```

A fourth file lives only on branch `tools/trust-publishers` (commit `aa999eb`,
not on `main`): `tools/trust-publishers.ts` (213 lines). See §4.

### Tool: `verify-repo-shape.ts`

**Purpose.** Asserts a consumer repo has the files its kind declares.

**CLI shape.**
```
bun run tools/verify-repo-shape.ts --kind <kind> [--repo <path>]
```
- `--kind` matches `kinds/<kind>.yaml`.
- `--repo` defaults to `process.cwd()`.
- Exit 0 = shape OK (warnings allowed); exit 1 = missing required files;
  exit 2 = bad input (missing `--kind`, unknown kind).

**What it checks.**
1. Always-required hygiene files: `LICENSE`, `README.md`, `.editorconfig`,
   `.gitattributes`, `.gitignore`.
2. `CLAUDE.md` if the manifest pulls a `claude/` template.
3. Every workflow declared in `kind.workflows` has a corresponding
   `.github/workflows/<name>.yml` (warning, not failure — consumer may name
   the file differently).
4. Every `packages.devDependencies[]` in the manifest is present in the
   consumer's `package.json` devDependencies (warning).
5. `Cargo.toml` if the manifest sets `cargo.workspace`.

**Conventions used.**
- Plain bun script, shebang `#!/usr/bin/env bun`, `+x` bit set.
- `parseArgs` from `node:util` (no commander/yargs/clipanion).
- `yaml` (workspace-pinned `^2.6.0`) for manifest parsing.
- `node:fs` `existsSync`, no fs/promises, no recursive globbing.
- biome-ignore comments on every `console.*` line because shared biome config
  bans `noConsole` (`lint/suspicious/noConsole: CLI script` is the documented
  escape hatch idiom).
- ESM, NodeNext-equivalent (`Bundler` resolution + `ESNext` module per
  `tools/tsconfig.json`).

**How it's invoked.**
- Locally: `bun run tools/verify-repo-shape.ts ...` or `moon run tools:check`
  / `moon run tools:test` / `moon run tools:ci`.
- In shared-configs's own CI: `.github/workflows/ci.yml` calls
  `verify-repo-shape.yml` with `kind: 'ts-application'`, dogfooding the tool
  on shared-configs itself.
- In consumer repo CI: `.github/workflows/verify-repo-shape.yml` (reusable,
  pinned `@v1`) checks out the consumer at `./consumer`, checks out
  `fellwork/shared-configs` at `ref: v1` to `./shared-configs`, then runs
  `bun run tools/verify-repo-shape.ts --kind <input> --repo ../consumer`.

**Notable design choices.**
- Verifier lives in shared-configs and gets git-cloned at run time — it is
  *not* an npm-published binary. The consumer never installs it.
- It never reads file *contents*, only presence. Content drift is foreman's
  job (`foreman sync`, planned).
- "Warning vs missing" split exists: workflow-name mismatches and
  package.json devDep gaps are warnings, hygiene-file absence and
  Cargo.toml absence are hard failures. There is no `--strict` flag yet.

### Tool: `validate-kinds.ts`

**Purpose.** Schema-validates every `kinds/*.yaml` against `kinds/_schema.json`.

**CLI shape.** No flags. Reads all `kinds/*.yaml`, validates against
`kinds/_schema.json`, reports per-file pass/fail. Exit 0 if all pass, 1
otherwise.

**What it checks.**
1. `data.kind` matches the filename (without `.yaml`).
2. The full Ajv-compiled JSON Schema (`additionalProperties: false`,
   pattern-checked `kind`, structured `packages.peerDependencies` items, etc.).

**Notable details.**
- Strips `$schema` before compiling (avoids Ajv trying to fetch the
  meta-schema URI over the network — a deliberate offline-CI guard).
- Documents Ajv 8 ESM/CJS interop quirk (`(AjvLib as any).default ?? AjvLib`).
- `inputs:` declared in `tools/moon.yml` covers `../kinds/**/*.yaml` and
  `../kinds/_schema.json` so moon caches correctly.

### Shared conventions across the two tools

| Convention | Both files |
|---|---|
| Shebang | `#!/usr/bin/env bun` |
| Args | `node:util` `parseArgs`, no third-party CLI lib |
| Output | `console.log` / `console.error` with biome-ignore escape |
| YAML | `yaml` package |
| Schema | Ajv 8 |
| Path resolution | `fileURLToPath(import.meta.url)` → `dirname` → `..` |
| Error model | Print message, `process.exit(1|2)`. No structured error types. |
| Tests | colocated `*.test.ts` using `bun:test`, spawn the script via `execSync` |
| Lint hygiene | biome-ignore `lint/suspicious/noConsole: CLI script` per call site |
| File size | <150 LOC each — small, single-purpose, single file |

### tools/moon.yml task graph

```
tools:check          → bunx biome check on the four .ts files
tools:test           → bun test (runs both *.test.ts)
tools:validate-kinds → bun run validate-kinds.ts
tools:ci             → noop, deps: [check, test, validate-kinds]
```

The root `moon.yml` `:ci` task fans out to `~:check` and
`packages.*:check` / `packages.*:test` — but **does not currently depend
on `tools:ci`**. (Risk noted in §5.)

### CI wiring summary

- `.github/workflows/ci.yml` (shared-configs's own CI) calls `ts-ci.yml` and
  `verify-repo-shape.yml`. Doesn't call moon's `tools:ci` directly.
- `.github/workflows/verify-repo-shape.yml` is the reusable workflow that
  exposes `verify-repo-shape.ts` to consumers via `bunx`-from-git-clone.
- `.github/workflows/npm-release.yml` is OIDC-only (`id-token: write`,
  `permissions:` declared, no `NPM_TOKEN` secret accepted as input,
  uses `changesets/action@v1`).

---

## 2. Maintenance / config / management / security / implementation concerns surveyed across the 8-repo ecosystem

Categorized. Each item cites a path or pattern in a specific repo so the
Architect can chase it down.

### Maintenance

- **Workflow tag movement.** Spec §5 calls for a `tag-workflows.yml` that
  moves `@v1` / `@v2` major refs forward when reusable workflows change in
  backward-compatible ways. **Not yet built** — there is no
  `tag-workflows.yml` in `shared-configs/.github/workflows/`. The spec
  flags this as Phase 6 / shared concern.
- **Drift between scaffolded repos and templates.** Spec §6 example C ("3
  months later, clippy.toml has tightened") describes `foreman sync` as a
  cruft-style update. Foreman does not yet implement this — `c:/git/fellwork/foreman/` is currently a Rush
  Stack template carcass with an `agent-team-orchestration-plan.md` and no
  scaffolder code. Means *whatever shared-configs ships, foreman cannot
  yet consume it*.
- **Bun lockfile freshness.** TS CI uses `bun install --frozen-lockfile`
  (see `c:/git/fellwork/shared-configs/.github/actions/setup-bun-biome/action.yml`).
  No tool today verifies `bun.lock` matches `package.json` declared deps
  before CI fails on it.
- **Dead code / dead packages.** No tool detects `@fellwork/*` packages
  whose `kind.packages.devDependencies` entry has been removed from every
  kind manifest (i.e., orphaned packages that should be deprecated).
- **CHANGELOG management.** Changesets writes per-package CHANGELOGs, but
  there is no top-level repo CHANGELOG for shared-configs itself, and no
  per-package CHANGELOG for things outside `packages/` (e.g., the
  workflow files, the templates dir).
- **Version drift across consumers.** No tool reports which Fellwork repos
  are pinned to which `@fellwork/*` versions, or which are stale relative
  to latest.
- **`api`'s vendored `.fw-domain-lint.toml`.** `c:/git/fellwork/api/CLAUDE.md`
  documents that this file "lives in this repo at the root (vendored from a
  previous shared-config experiment)." Spec §4 + Phase 5 plan to move it
  to `shared-configs/templates/rust/` and have CI git-fetch at a pinned
  tag (`domain-lint-v1`, currently the default in
  `.github/workflows/rust-ci.yml`). `templates/rust/` already has
  `clippy.toml` / `rustfmt.toml` / `deny.toml` / `rust-toolchain.toml` but
  **does not yet contain `.fw-domain-lint.toml`** — so the migration is
  half-done and api still has the canonical copy.

### Configuration

- **Generating per-repo configs from kind manifests.** `kinds/*.yaml`
  encode `tsconfig.extends`, `cargo.workspace`, `scripts`, `packages.*`,
  `workflows`, `renovate.extends`. Today `verify-repo-shape.ts` only
  *checks* presence; nothing generates these files from a manifest. That's
  intentionally foreman's job per spec §6, but no tool today produces
  even a "what would foreman generate?" preview.
- **Migrating between kind-manifest schema versions.** `kinds/_schema.json`
  has `$id` pinning a schema URL but no schema version field on manifests
  themselves. If the schema evolves, no tool migrates older manifests
  forward. (Cruft-style migration is needed; nothing exists.)
- **`scribe` is a config orphan.** `c:/git/fellwork/scribe/` has no
  `CLAUDE.md`, uses vitest (not bun test), uses `^2.4.13` biome (not the
  `2.4.13` exact version pinned in shared-configs), has its own `biome.json`
  and `tsconfig.base.json` + `tsconfig.json`. It hasn't adopted shared-configs.
  Bootstrap clones it (`repos.psd1`) but its kind is unclear — `polyglot`?
  `ts-application`? `ts-library`? No kind manifest claims it.
- **`web` is a packages-inside-app outlier.** `c:/git/fellwork/web/CLAUDE.md`
  documents `@fellwork/{shared,core,plugin-sdk,tsconfig}` living *inside*
  the web repo as bun workspaces. It also notes: "A future cleanup would
  collapse them into `apps/web/packages/` + TS path aliases, dropping the
  workspace protocol." This is exactly the kind of cross-repo refactor a
  tools suite might want to mechanize.
- **Validation-of-config-files-in-consumers.** Today there is no tool that
  validates a consumer's `tsconfig.json` actually extends `@fellwork/tsconfig/*`
  or that its `biome.json` extends `@fellwork/biome-config/*`. The verifier
  checks dep presence, not config-file content.

### Management

- **Adding/removing a repo from the ecosystem.** Bootstrap's `repos.psd1`
  is the *only* canonical list (per design Decision 13). To add a repo,
  you edit `c:/git/fellwork/bootstrap/repos.psd1`. shared-configs does not
  enumerate the fleet anywhere — by design, but it means there's no source
  of truth shared-configs's own tools can read.
- **Onboarding contributors.** Bootstrap's PowerShell script and 658
  test assertions handle new-machine onboarding. shared-configs has no
  contributor tooling beyond `bun install` + `moon run :ci`.
- **Archiving deprecated repos.** Spec phase 10 plans to archive
  `fellwork/tsconfig` and `fellwork/lint`. No tool helps. The
  deprecation README pattern (per spec §7 phases 1–2) is also manual.
- **Cross-repo refactoring orchestration.** Bootstrap's `bootstrap heal`
  is intended for this (per spec §8 future point 5), tied to
  `.foreman.lock`. None of it exists yet.
- **Fleet inventory.** Nothing reports "for each Fellwork repo: which kind,
  which shared-configs SHA, which @fellwork/* versions, last sync date".
  This is the gap `bootstrap heal` (future) is planned to fill.

### Security

- **OIDC trusted publisher registration / audit.** Spec §5 mandates each
  `@fellwork/*` package be registered as a trusted publisher on npmjs.com,
  per-package, naming repo + workflow. Branch `tools/trust-publishers`
  attempted to mechanize this (see §4) but was abandoned because
  `npm trust github` ships natively in npm 11.9+. *Audit* (listing what's
  actually registered) was the open question on that branch.
- **Secret rotation.** `c:/git/fellwork/lint/.github/workflows/release.yml`
  still uses `NPM_TOKEN` secret (legacy pre-OIDC). Once lint is folded in
  per spec phase 2, that secret should be revocable. No tool tracks which
  Fellwork repos still hold long-lived publish secrets.
- **Dependency CVE scanning.** Templates ship `dependabot.yml` (in
  `templates/dependabot.yml`) for npm, but no equivalent for Cargo
  workspaces in `templates/rust/` (`api`'s `cargo deny` config lives in
  `templates/rust/deny.toml` — that handles license/advisory but is per-repo).
- **License auditing.** `templates/rust/deny.toml` exists. No tool covers
  TS/JS license audit fleet-wide.
- **SBOM generation.** No findings.
- **Vulnerability response across repos.** No findings — would need fleet
  inventory first (see Management).
- **Skill / MCP supply chain.** Out of scope for shared-configs but worth
  flagging: `c:/git/fellwork/shared-configs/.claude/` exists (the new
  `.claude/` directory at the repo root, currently untracked per
  `git status` summary). What lives in there matters for any agent-driven
  tools.

### Implementation

- **Scaffolding new repos.** Foreman's job per spec §8, but foreman is
  empty (Rush template) so today this is fully manual. Tools that *could*
  be building blocks: a kind-manifest reader (already exists in
  `verify-repo-shape.ts` as `loadKind`), a template-copier, a placeholder
  substituter (open question per spec Appendix B), a `.foreman.lock`
  writer.
- **Updating boilerplate in already-scaffolded repos (cruft-style).** Spec
  §6 example C. Today: not implemented anywhere.
- **Template variable substitution.** Spec Appendix B explicitly defers
  this ("`${var}` vs. `{{var}}` vs. mustache-lite"). Currently no
  substitution; templates with `.tmpl` suffix exist
  (`README.md.tmpl`, `LICENSE.tmpl`, `CODEOWNERS.tmpl`, `fly.toml.tmpl`,
  `CLAUDE.md.tmpl`) but no engine reads them.
- **Kind manifest evolution.** Already a concern (see Configuration above).
- **Reusable-workflow major-tag bumping.** No `tag-workflows.yml` yet.
- **First-publish bootstrap of new packages.** Spec §5 documents the
  manual flow (granular token in `.env`, publish from laptop, register as
  trusted publisher, discard token). No tool automates the steps inside
  this — though `trust-publishers.ts` (§4) addressed the trust-registration
  step before it was superseded.

---

## 3. External prior art

Survey of how mature multi-repo platforms ship tools suites. Citations are
inline; full URL list at the bottom of the section.

### Spotify Backstage

What it ships:
- **Software Catalog** — central registry of services/sites/libs/data
  pipelines with ownership + lifecycle metadata. Foreign-key concept to
  every other Backstage tool.
- **Scaffolder** — golden-path templates; user fills a form, Backstage
  creates a new repo with the chosen tech stack. Templates emit
  catalog-compliant metadata at creation.
- **Plugins** — ~150+ plugins (Tekton, ArgoCD, Kubernetes, Sonar, etc.),
  each adding a UI surface. Plugin model is the extension point.
- **TechDocs** — docs-as-code rendered into the portal.
- **kubectl-style declarative descriptors** for catalog entities.
- **Permissions framework** that Scaffolder respects.

How organized: **monolithic frontend portal + plugin ecosystem.** Heavy
weight (Node + React app) compared to a CLI suite. The CLI surface
(`@backstage/cli`) is for *building* Backstage itself, not consumed
day-to-day by app developers.

How new tools are added: write a plugin, register it in `app-config.yaml`.

Relevance to shared-configs: Backstage's "Catalog as the integration
keystone" pattern maps to shared-configs's `kinds/` manifests. The
"scaffolder enforces descriptor completeness at creation time" pattern is
already implicit in the plan (foreman writes `.foreman.lock` per spec §8).

### Shopify CLI / Spin

What `@shopify/cli` ships (npm distributable, single binary):
- App scaffolding (`shopify app init`).
- Local dev server for Shopify apps + themes.
- Build/deploy/release commands for app extensions.
- Theme push/pull/dev/check commands.
- AI Toolkit (recent, agent plugins for CLI/IDEs).

Spin (separate, internal-leaning):
- "Constellation" config = a set of repos that work together to build a
  dev environment. Constellation is itself an app.
- Replaces local dev with on-demand Kubernetes containers.
- systemd-based partitioning to mimic compose/k8s without forcing the
  developer to spread their project across multiple pseudomachines.

How organized: **one mega-CLI** (`shopify`) for end-developer commands;
Spin is a separate platform. Single binary distribution favored.

Relevance: the "constellation" idea is roughly bootstrap's domain (the 7
sibling repos as a unit). Single-binary mega-CLI is a model worth
considering.

### Vercel Turborepo

What `turbo` ships (single binary):
- `turbo run` — task graph execution with caching (the core).
- `turbo gen` — template-based code generation (apps, packages, custom
  generators in `turbo/generators/`).
- `turbo prune` — lockfile + workspace pruning for sparse Docker images.
- `turbo login` / `turbo link` — remote cache auth.
- `turbo telemetry` — opt-out flag.

How organized: **one binary, subcommands.** Plugins are out of scope for
the binary itself; configuration via `turbo.json` per task.

How new tools are added: as new subcommands in the Rust source. There's
no plugin model.

Relevance to shared-configs: turbo's split is task-orchestrator (`run`)
+ scaffolder (`gen`) + lifecycle utility (`prune`) + auth (`login`).
shared-configs already has moon as the orchestrator; the question is
whether a single shared-configs CLI bundles everything else, or each
script stays one-tool-per-file like today.

### Astral (uv, ruff, ty)

Philosophy: **single static binary that consolidates fragmented tooling.**

`uv` replaces pip + pip-tools + virtualenv + pipx + tox + poetry + pyenv +
parts of ruff. `ruff` consolidates linter + formatter. `ty` (still
maturing) is the type checker. Vision: "Cargo for Python."

How organized: each tool is a separate binary, but Astral's intent is
that they share infrastructure and feel unified. No-Python-dependency
bootstrap (uv ships standalone).

Relevance to shared-configs: the implication is "ship one tool that does
many things" rather than "many separate scripts." Counterpoint: the
existing tools/ uses one-file-per-tool with `parseArgs` and that's
working for two scripts. Astral's model only pays off when you have
many tightly-related operations.

### Nx

What Nx ships:
- **Generators** — code scaffolding (new app, new component, custom
  generators per workspace).
- **Executors** — wrap build/test/lint/serve operations on projects.
- **Migrations** — automated codemods to upgrade Nx itself or consumed
  libraries (`nx migrate`).
- **Project Graph** — affected-graph for "only run what changed."
- **Plugin Registry** — third-party generators/executors.
- **`convert-to-monorepo` generator** — one-shot migration from standalone
  to monorepo.

How organized: **plugin ecosystem under one CLI (`nx`).** New
capabilities arrive via plugins; each plugin contributes generators +
executors + migrations.

Relevance: the **affected-graph** concept is what bootstrap could use
for "only re-sync the repos whose kind manifest or shared template
changed." Nx's **migrations** model (codemods carried by the consumed
library) is the cleanest answer to "how do consumer repos pick up
schema changes" — a model the Architect should weigh against cruft.

### Mage / Just / Make

`just` is a command runner (no file dependencies, no build semantics).
Justfile syntax = better Make. Ships as single Rust binary. Used as a
"convention CLI" — `just deploy`, `just test`, `just sync` — surfacing
project commands with `just --list`.

Relevance: **moon already plays this role** in shared-configs. The
Architect should not re-pick this; rather, decide whether tools/ scripts
register as moon tasks (current pattern) or expose a separate `fellwork`
CLI on top.

### rush.js / Rush Stack

What Rush ships:
- `rush install` / `rush update` — workspace install with lockfile
  reconciliation.
- `rush change` — generate changelog entries (the rush-flavored
  equivalent of `changesets add`).
- `rush build` — orchestrated build with phased + incremental support.
- `rush publish` — version bump + npm publish.
- `rush purge` — node_modules cleanup.
- `rush deploy` — assemble a slim deploy folder.

Rush Stack adjuncts: Heft (project-scoped build toolchain), API
Extractor, Lockfile Explorer, `@rushstack/eslint-bulk` (rolls out new
lint rules across a monorepo).

How organized: **one mega-CLI (`rush`) + auxiliary `@rushstack/*` tools
each with their own CLI.** Foreman repo currently uses Rush as its
build system (`rush.json`, `common/`, `libraries/cli`, etc.) — so
"Rush patterns" are already partly familiar to this ecosystem.

Relevance: the **`eslint-bulk` model** (rolling out a new lint rule
across many packages with a tool that knows the workspace) is exactly
the pattern shared-configs needs for "we tightened biome config v0.3,
let me apply it everywhere."

### Changesets

What it ships:
- `changeset` (add) — interactive changeset authoring.
- `changeset version` — bump versions + write CHANGELOGs.
- `changeset publish` — npm publish.
- `changeset status` — see what's queued.
- `changesets/action@v1` — GitHub Action that opens a "Version Packages"
  PR and publishes on merge.

shared-configs **already uses changesets.** The npm-release.yml workflow
is the reference implementation: OIDC + `changesets/action@v1` +
`bunx changeset publish`. No gap here.

Relevance: changesets is the version-management primitive the Architect
should *not* reinvent. Any tools-suite tool that produces a release
should integrate by writing a changeset, not by calling npm publish
directly.

### kubectl / Helm / cruft / cookiecutter

- **Helm** — declarative install/upgrade/rollback of bundled k8s
  manifests. Charts are reusable templated deployments. Lifecycle:
  install / upgrade / rollback / uninstall.
- **kubectl** — imperative shell over a declarative cluster, with
  `apply -f` as the bridge.
- **cruft + cookiecutter** — the prior art most directly relevant. cruft
  links a generated project to its template via `.cruft.json` (commit
  hash), then `cruft check` / `cruft update` diff template-now vs
  template-then and apply patches with skip-glob support and conflict
  prompts. **Spec §6 example C is essentially "implement cruft for
  Fellwork."**

Relevance: cruft is the closest existing tool to what foreman/sync needs.
It's Python-only and requires cookiecutter as the templating engine —
not directly reusable, but its data model (`.cruft.json` ≈
`.foreman.lock`, `cruft check` in CI ≈ what verify-repo-shape *could*
become with a `--strict` flag) is the canonical reference.

### Sources

- [Backstage Software Catalog and Developer Platform](https://backstage.io/)
- [Backstage Scaffolder docs (Spotify)](https://backstage.spotify.com/docs//portal/core-features-and-plugins/scaffolder)
- [Shopify CLI docs](https://shopify.dev/docs/api/shopify-cli)
- [Shopify Spin engineering blog](https://shopify.engineering/shopifys-cloud-development-journey)
- [Turborepo `gen` docs](https://turbo.build/repo/docs/reference/command-line-reference/gen)
- [Turborepo `run` docs](https://turborepo.dev/docs/reference/run)
- [Astral uv blog](https://astral.sh/blog/uv)
- [Astral uv docs](https://docs.astral.sh/uv/)
- [Nx generators reference](https://nx.dev/docs/reference/workspace/generators)
- [Nx convert-to-monorepo generator](https://nx.dev/nx-api/workspace/generators/convert-to-monorepo)
- [Nx plugin registry](https://nx.dev/docs/plugin-registry)
- [Just task runner — Applied Go review](https://appliedgo.net/spotlight/just-make-a-task/)
- [Rush Stack overview](https://rushstack.io/)
- [Rush Stack monorepo (microsoft/rushstack)](https://github.com/microsoft/rushstack)
- [Changesets repo](https://github.com/changesets/changesets)
- [Using Changesets with pnpm](https://pnpm.io/using-changesets)
- [cruft docs](https://cruft.github.io/cruft/)
- [cruft GitHub](https://github.com/cruft/cruft)
- [Helm — Lifecycle management](https://notes.kodekloud.com/docs/Certified-Kubernetes-Administrator-CKA/2025-Updates-Helm-Basics/Lifecycle-management-with-Helm/page)
- [Cluster API for declarative cluster lifecycle](https://oneuptime.com/blog/post/2026-02-09-cluster-api-lifecycle-multi-cluster/view)

---

## 4. The half-written `tools/trust-publishers.ts` (lessons learned)

**Where it lives.** Branch `tools/trust-publishers` of shared-configs,
single commit `aa999eb` ("wip(tools): half-written trust-publishers.ts
(study artifact for tools roadmap team)"). 213 lines. Not on `main`.

**Original problem.** The 7 net-new `@fellwork/*` packages
(`oxlint-config`, `commitlint-config`, `release-config`, `renovate-config`,
`markdownlint-config`, `cspell-config`, `lefthook-config`) each need to be
registered as npm trusted publishers, naming `fellwork/shared-configs` +
`release.yml`. Doing this manually for 7 packages is tedious and
error-prone.

**Scope decisions made (visible in the file).**
- Wraps `npm trust github|gitlab|circleci` rather than calling the npm
  HTTP API directly — leverages the npm CLI's auth + interactive 2FA
  flow.
- Auto-detects the GitHub `owner/repo` from `git remote get-url origin`
  (regex matches both `https://github.com/owner/repo.git` and
  `git@github.com:owner/repo.git`).
- Defaults `--workflow release.yml` (matches the spec's reusable workflow
  filename).
- Provider whitelist: `github | gitlab | circleci`.
- npm CLI version check (`semverGte(version, '11.9.0')`) up front, exits
  with installation hint if too old.
- Two modes: bulk-register (default) and `--list` audit mode that runs
  `npm trust list <pkg>` per package.
- Help text via `--help`.
- Same biome-ignore + parseArgs + spawnSync conventions as the existing
  two tools.

**What it almost did.** Bulk-iterate every workspace package, run
`npm trust github <pkg> --file release.yml --repo owner/repo --yes`,
roll up failures, exit non-zero on any failure. The complete CLI plumbing
ships in the file; only the workspace-discovery function is left as
`throw new Error('discoverPackages not yet implemented')` with a doc
comment specifying exact behavior (read `package.json` workspaces field,
glob each entry, read each `packages/*/package.json`, return
non-private packages with both `name` + `version`, in workspace order).

**Why it was abandoned.** Per the commit message: "Superseded by
`npm trust github` shipping natively in npm 11.9+. The 7 trusted
publishers were ultimately registered manually via `npm trust github`
loop, not this script." So the bulk-register use case was a one-shot
need that the npm CLI now handles ergonomically enough.

**Gotchas surfaced (per the user's brief).**
- **`npm trust list` requires EOTP from CI environments.** When invoked
  from a non-interactive shell (CI, agent harness), the npm CLI prompts
  for an EOTP (email one-time password) for `npm trust list`, which
  cannot be answered. This is the open question that kept the audit
  mode from being usable in CI: **`npm trust list` is interactive-only
  for accounts with 2FA, which all `@fellwork/*` publishers will have.**
  An audit tool needs another path (npm registry API direct, or
  scheduled human-run).
- **npm 2FA EOTP errors during initial publish.** The first-publish
  bootstrap (granular token, laptop publish) sometimes emits EOTP-required
  errors even with the granular token; the workaround is `npm publish
  --otp <code>` typed interactively.
- **`bun publish` is not a substitute.** `c:/git/fellwork/lint/packages/biome-config/scripts/release.ts`
  documents in a multi-paragraph comment: "bun's publish auth is flaky
  (ignores NODE_AUTH_TOKEN, ignores NPM_CONFIG_TOKEN, ignores .npmrc files
  in CI for granular tokens, falls back to interactive browser auth that
  times out). npm publish reads the standard NODE_AUTH_TOKEN + .npmrc
  pattern and is battle-tested."

**Open scope question explicitly named in the commit message.** "Should
this become `trust-audit` instead of a bulk-register tool, given that
`npm trust github` already exists?" The audit use case has *recurring*
value (verify state matches expectation, alert if a package's trusted
publisher gets revoked / re-registered to a wrong repo); the
bulk-register use case has *one-shot* value (only when adding new
packages).

**What this teaches the team about future tools.**
- A tool that wraps a CLI primitive that already exists (`npm trust github`)
  has thin value; the audit/inventory side is where shared-configs's
  fleet-wide knowledge actually adds value.
- Interactive-by-design CLIs (anything that prompts for EOTP) cannot live
  in CI without an alternate code path.
- The `discoverPackages()` shape is reusable: every fleet-aware tool
  needs to enumerate workspace packages. Worth lifting into a shared
  helper.
- Single-file, single-responsibility, parseArgs + spawnSync, biome-ignore
  consoles, manual semver compare — the file conforms to the same
  conventions as the two shipped tools, suggesting the conventions are
  stable and the Architect should preserve them.

---

## 5. Risk register

Things that must not break.

1. **`tools/moon.yml` and the moon project layout.** `tools/` is a moon
   project. Tasks `check`, `test`, `validate-kinds`, `ci` are referenced
   by the root `moon.yml` only indirectly today — but consumers (and any
   future fleet runner) might depend on `moon run tools:ci`. Renaming
   `tools/` or restructuring the moon project shape will break those.
2. **The kind-manifest schema (`kinds/_schema.json`).** Tools depend on
   it, but so will `foreman` (per spec) and `bootstrap heal` (future).
   Backwards-incompatible changes ripple into all three. There's no
   schema-version field on manifests yet — adding one is itself a
   breaking change.
3. **`npm-release.yml` is OIDC-only.** The reusable workflow does not
   accept an `NPM_TOKEN` input by deliberate design (Decision 12). Any
   future tool that *publishes* (release helpers, first-publish
   bootstrap automation) cannot weaken this contract.
4. **`verify-repo-shape.yml` reusable workflow's @v1 tag.** Consumer
   repos pin against this tag. Moving it must remain backwards-compatible
   per spec §5; tools that change `verify-repo-shape.ts`'s CLI surface
   (flags, exit codes) must avoid breaking the workflow's invocation
   line.
5. **The bootstrap/foreman/shared-configs seam (spec §8).** `.foreman.lock`
   + `kinds/*.yaml` are the contract. shared-configs writes neither but
   is the source of truth for the second. Tools that *generate*
   `.foreman.lock` (foreman's job) must not be reinvented in
   shared-configs without an explicit cross-spec.
6. **Repos that are not yet shared-configs adopters.** All 8 sibling repos
   except shared-configs itself are pre-adoption. Tools that assume an
   adopted layout (`@fellwork/biome-config` in devDeps, etc.) will fail
   on api/web/ops/scribe today and must degrade gracefully or
   explicitly require adoption.
7. **`tools:ci` is not part of root `:ci`.** Root `moon.yml` `:ci` task
   depends on `~:check` + `packages.*:check` + `packages.*:test` but
   does not include `tools:*`. So today, `tools/` tests can break and
   shared-configs's own CI passes. **This is itself a risk** — if a
   future tool depends on tools/ output during root CI, it'll silently
   skip.
8. **The `.fw-domain-lint.toml` migration is half-done.** `api` still
   holds the canonical copy, but `rust-ci.yml` already references
   `domain-lint-v1` tag of shared-configs. If a tool moves the file
   prematurely, both repos can fail.
9. **Branch `tools/trust-publishers` is preserved as a study artifact.**
   Its commit message explicitly names this. Tools that "clean up
   stale branches" must not auto-delete this branch.
10. **`scribe` has no kind, no CLAUDE.md, no shared-config adoption.**
    Tools that fleet-iterate (e.g., "for every Fellwork repo, do X") must
    not assume scribe matches any kind. Bootstrap clones it but
    shared-configs does not know what to do with it yet.
11. **Emoji policy mismatch.** `verify-repo-shape.ts` and `validate-kinds.ts`
    print `✓` / `✗` glyphs; the broader Fellwork agent guidance ("avoid
    emojis unless asked") is explicit. The tools' use of glyphs is small
    and intentional but new tools should consider whether they're
    consistent with that policy.
12. **Bun version pin.** `tools/` runs under bun (`#!/usr/bin/env bun`,
    `bun:test`). `.prototools` pins bun `1.1.42`; web's CLAUDE.md notes
    bun `1.3.8`. Cross-repo bun version drift exists. Tools that rely on
    bun-specific APIs must declare a min version.

---

## 6. Do-not-break list

Specific paths and contracts that must remain stable.

### Files / paths (do not move, do not rename without coordinated migration)

- `c:/git/fellwork/shared-configs/tools/verify-repo-shape.ts` — invoked by
  reusable workflow `verify-repo-shape.yml@v1` from consumer repos via
  git clone.
- `c:/git/fellwork/shared-configs/tools/validate-kinds.ts` — invoked by
  `tools:validate-kinds` task and indirectly by `tools:ci`.
- `c:/git/fellwork/shared-configs/tools/moon.yml` — task names `check`,
  `test`, `validate-kinds`, `ci` are referenced by name.
- `c:/git/fellwork/shared-configs/kinds/_schema.json` — schema id
  `https://github.com/fellwork/shared-configs/blob/main/kinds/_schema.json`
  is part of the contract; consumers (and future foreman) parse against it.
- `c:/git/fellwork/shared-configs/kinds/*.yaml` — six manifests; each
  filename **must** equal `kind:` field per the validator's check.
- `c:/git/fellwork/shared-configs/.github/workflows/verify-repo-shape.yml`
  — reusable workflow with input `kind: <string>`. CLI surface frozen.
- `c:/git/fellwork/shared-configs/.github/workflows/npm-release.yml` —
  OIDC-only, `permissions: id-token: write` mandatory, no `NPM_TOKEN`
  input.
- `c:/git/fellwork/shared-configs/.github/actions/setup-bun-biome/action.yml`
  — composite action consumed by reusable workflows.
- `c:/git/fellwork/shared-configs/templates/rust/.fw-domain-lint.toml`
  (planned home; arrives in spec phase 5). Any tool that reads it from
  shared-configs must tolerate it being absent until phase 5 ships.
- `c:/git/fellwork/api/.fw-domain-lint.toml` (current canonical home)
  must continue to work until phase 5 migration completes.

### Conventions to preserve

- **Single-file, single-responsibility tool scripts** with shebang
  `#!/usr/bin/env bun`, executable bit, `parseArgs` from `node:util`,
  no third-party CLI library. (Established by the two existing tools
  and the trust-publishers WIP.)
- **biome-ignore `lint/suspicious/noConsole: CLI script`** comment idiom
  on every console call — required by the shared biome config.
- **Colocated `*.test.ts` per tool** using `bun:test`, spawning the
  script via `execSync` against tmp dirs. (Both shipped tools follow
  this; new tools should too.)
- **Exit code contract.** `0` = ok, `1` = soft failure (work to do),
  `2` = bad input / config error. Both shipped tools use this.
- **Conventional Commits** with the allow-listed types (per repo's
  CLAUDE.md: `add, breaking, build, chore, chore-deps, chore-release,
  ci, config, docs, feat, fix, i18n, perf, refactor, release, remove,
  revert, security, style, test`).
- **Changesets-driven release** — tools that publish anything as an
  npm package go through changesets, never direct `npm publish`.
- **OIDC-only publishes** — no `NPM_TOKEN` secret in any new shared
  workflow.
- **Templates as plain files**, not a templating engine, so `foreman
  sync` diffs cleanly (Decision 8). Tools that produce templates must
  not introduce a templating engine without a spec amendment.
- **Major-tag pinning** for reusable workflows (`@v1`, `@v2`); tools
  that publish workflows must respect this.

### Contracts with downstream repos

- Consumer repos invoke `bun run tools/verify-repo-shape.ts --kind X
  --repo Y` via the reusable workflow. The CLI flag set must remain
  `--kind` + `--repo`; renaming or removing flags breaks every
  consumer's CI.
- `kinds/<name>.yaml` filename = `kind:` field is a hard contract
  (validator enforces it; foreman will read it).
- `.foreman.lock` schema is owned by foreman per spec Appendix B —
  shared-configs tools must not write `.foreman.lock` themselves.
- bootstrap's `repos.psd1` is the canonical list; shared-configs tools
  that need to enumerate the fleet must read it from bootstrap, not
  duplicate it.

### Things specifically called out as non-goals or deferred (don't
re-open without explicit user approval)

- Templating-engine choice (spec Appendix B).
- `.foreman.lock` schema (foreman owns it).
- Bootstrap-side kind awareness (deferred to bootstrap's own design
  cycle per Decision 14).
- Bootstrap's canonical repo list living in shared-configs (explicitly
  rejected in Decision 14).
- Languages beyond TS and Rust (spec §1 out-of-scope: no Python, no Go).
