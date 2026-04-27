# Fellwork shared-configs — `tools/` roadmap spec

**Status:** approved (2026-04-27)
**Author:** Architect (agent team)
**Companion specs:** `2026-04-26-fellwork-shared-configs-design.md`
**Companion artifact:** `scout-report.md` at repo root, branch `spec/tools-roadmap`, commit `c9dd099`
**Companion branch:** `tools/trust-publishers` (preserved as study artifact)

This spec sets the architecture, taxonomy, and 6–12 month roadmap for
`shared-configs/tools/`. It is the canonical reference for any agent or
human picking up a tool to build. Every architectural call is decided
here; no TBDs are left in §2.

---

## 1. Mission and scope of `shared-configs/tools/`

`shared-configs/tools/` is the **canonical home for every executable
script that operates on the shape of the Fellwork ecosystem from the
shared-configs side of the seam.** A tool here exists to read, validate,
inventory, audit, or evolve the contracts that `shared-configs` itself
publishes (`kinds/*.yaml`, `templates/`, `packages/`, reusable
workflows) — or to verify that consumer repos comply with those
contracts.

### What `tools/` does

- Reads kind manifests, the `_schema.json`, and `templates/` to validate
  internal consistency.
- Verifies consumer repos' shape against the contracts shared-configs
  publishes (existing: `verify-repo-shape.ts`).
- Audits cross-fleet state where shared-configs is the authority (which
  packages exist, which are registered as trusted publishers, which kind
  manifests reference orphan packages).
- Provides building blocks (importable as TS modules; see Decision 8)
  that foreman and bootstrap can call into rather than re-implementing
  kind parsing, package discovery, etc.
- Wires into shared-configs's own CI (`tools:ci`) and into reusable
  workflows that consumer-repo CIs invoke.

### What `tools/` does NOT do

| Boundary | Owner | Why |
|---|---|---|
| **Multi-repo clone / fleet orchestration** | `bootstrap` | Bootstrap owns the canonical repo list (`repos.psd1`, Decision 13 of design spec). Tools must never duplicate it. |
| **Per-repo scaffolding / `foreman new` / `foreman adopt` / `foreman sync`** | `foreman` | Foreman owns `.foreman.lock` (Appendix B of design spec). Tools must never write `.foreman.lock`. |
| **Published JS/TS configuration** | `packages/` | Configs are data, not code. They land via npm + Renovate, not via tools/. |
| **File-copyable assets** | `templates/` | Templates are inert files. Tools may *read* them; they must not become a templating engine (Decision 8 of design spec). |
| **Per-repo CI orchestration** | consumer repo | Consumer CI calls into shared-configs via reusable workflows (`uses: fellwork/shared-configs/.github/workflows/x.yml@v1`). Tools must not assume they can mutate consumer-repo workflow files. |
| **Task running** | `moon` | Moon is the task graph. Tools register *as* moon tasks; they are never a competing runner. |

The cleaner this distinction stays, the easier each future tool decision
becomes. **A proposed tool that needs to enumerate the Fellwork repo
fleet is a bootstrap tool, not a shared-configs tool.** A proposed tool
that needs to write into a consumer repo is a foreman tool. If a request
sits ambiguously between, the heuristic is: *does the tool consume
shared-configs's contracts, or does it produce them?* Producers belong
here; consumers belong upstream.

---

## 2. Architectural decisions

These are the design questions the team must resolve before tool count
grows. Each is decided with rejected alternatives noted.

### a. Many single-file scripts vs. one mega-CLI

**Decision: stay single-file-per-tool through v0.x; revisit at v1.0
once tool count ≥ 8.**

The two existing tools (`verify-repo-shape.ts`, `validate-kinds.ts`) are
< 150 LOC each, share no runtime state, and are invoked by name from
moon tasks and reusable workflows. Per Scout §1, the conventions
(shebang, parseArgs, single-file, colocated test) are stable. Bundling
prematurely would require reworking `verify-repo-shape.yml@v1`'s
invocation line, which is a do-not-break (Scout §6).

Rejected alternatives:

- **Mega-CLI now (Astral uv model).** Pays off only with many tightly
  related operations (per Scout §3). At 2 tools, premature.
- **Many single-file forever (status quo).** Discovery fails when count
  exceeds ~8 (no help index, no shared flag conventions). Lock the
  status quo *for v0.x only*, plan the unification at v1.0.

The v1.0 unification, when it happens, will be a thin dispatcher
(`tools/fw.ts` or similar) that imports each existing single-file tool's
exported `main()` and routes by subcommand. No tool rewrites; the
single-file scripts stay. This presupposes Decision 8.

### b. Where does configuration come from?

**Decision: tools take CLI args + autodetect first, read kind manifests
second, never invent a `tools/<name>.config.json` or top-level
`fellwork.toml`.**

Kind manifests already encode the cross-cutting facts (which packages
belong to which kind, which workflows ship, etc.). Adding a parallel
config surface fragments authority. CLI args + kind manifests cover
every case the v0.x tools need.

Rejected alternatives:

- **Per-tool config files.** Drift risk; Scout §2.maintenance flags
  drift as a real concern.
- **Top-level `fellwork.toml` listing the fleet.** That's bootstrap's
  `repos.psd1` (Decision 13 of design spec). Duplicating it here is
  explicitly rejected.

Where a tool needs cross-fleet awareness (e.g., "for every Fellwork
repo, do X"), the tool **shells out to bootstrap** to enumerate, or
takes the repo list as a CLI arg. Tools never read `repos.psd1`
directly.

### c. Primary invocation pattern

**Decision: `bun run tools/<name>.ts` is canonical for local invocation.
`moon run tools:<name>` is canonical for CI invocation. Reusable
workflows are the canonical invocation surface for *consumer* repos.**

The matrix:

| Surface | When appropriate | Example |
|---|---|---|
| `bun run tools/<name>.ts ...` | Local dev, ad-hoc, agent-driven | `bun run tools/verify-repo-shape.ts --kind ts-library` |
| `moon run tools:<name>` | shared-configs's own CI, dependency-aware invocation | `moon run tools:ci` |
| Reusable workflow `uses:` | Consumer-repo CI | `uses: fellwork/shared-configs/.github/workflows/verify-repo-shape.yml@v1` |
| Published `bin` | Reserved; **not used in v0.x** (see §2.d) | (n/a) |

Rejected alternatives:

- **A new top-level `fw` binary on PATH.** Premature (see §2.a).
- **moon-only.** Breaks consumer CI which can't run moon without
  installing it, and breaks ad-hoc local agent invocation.

Every new tool **must** ship with a moon task in `tools/moon.yml` AND a
reusable workflow IF it is meant to be invoked by consumer-repo CI.

### d. Are tools npm-published?

**Decision: tools are NOT npm-published in v0.x. They are git-cloned at
run time by the reusable workflows that need them. Revisit at v1.0
under Decision 8.**

This matches `verify-repo-shape.ts`'s existing model (Scout §1: "git-cloned
at run time, not an npm-published binary"). It avoids:

- A `@fellwork/tools` package version drift problem.
- Consumer repos installing a binary they only need in CI.
- Breaking the OIDC-only release pipeline (Scout §6 do-not-break).

The v1.0 question (Decision 8) is whether to publish the *library
surface* (importable functions) as `@fellwork/tools` while keeping the
CLI scripts git-cloned. That is the natural evolution path.

Rejected alternatives:

- **Publish `@fellwork/tools` now.** Forces every tool to follow npm
  release cadence (changesets, OIDC); right now the tools are not
  re-used cross-repo and the publish pipeline overhead exceeds the
  benefit.
- **Mixed (some tools published, some not).** Two distribution models
  for the same conceptual surface area is a documentation tax we should
  pay only when forced.

### e. Testing convention

**Decision: lock in the existing convention. Colocated `<name>.test.ts`,
`bun:test`, `execSync`-based black-box tests against tmp dirs.
Add `tools/fixtures/` as the canonical home for shared fixture data.**

Per Scout §1, both shipped tools follow this. The trust-publishers WIP
also follows this (Scout §4). The convention is stable.

Constraints that follow from locking it in:

- Every new tool ships with `<name>.test.ts` in the same directory.
- Tests must be hermetic (tmp dirs, no network, no real npm registry
  calls — mock at the spawnSync boundary).
- Fixtures shared across tools live in `tools/fixtures/<topic>/`.
- `tools:test` task in `tools/moon.yml` must include the new test file
  (the current task glob `*.ts` already covers this — verify it does
  for new files).

Rejected alternatives:

- **Move to vitest.** scribe uses vitest (Scout §2.config) but
  shared-configs is bun-native. Two test runners would create lockfile
  drift.
- **Pure white-box tests (import the tool's functions, no execSync).**
  Loses the exit-code contract verification. Keep black-box; add
  white-box only where it provides incremental value.

### f. How tools share code

**Decision: lazily extract to `tools/lib/` once two tools want the same
code. Until then, copy. No premature library.**

Rule of three is too lax for our scale (we have 2 tools today, expect
~15). Rule of two is right.

The first extraction will likely be `discoverPackages()` (per
Scout §4, "every fleet-aware tool needs to enumerate workspace
packages"). When that happens:

- Create `tools/lib/discover-packages.ts` with the function and its
  test.
- Both consuming tools import via relative path (`../lib/discover-packages.ts`).
- `tools/lib/` is not its own moon project; it's part of `tools/`.
- `tools/lib/*.ts` files **must be importable** (no top-level `process.exit`,
  no shebang side-effects on import).

Naming: `tools/lib/<topic>.ts`, one topic per file. No `index.ts`
barrel; explicit imports.

Rejected alternatives:

- **Build `tools/lib/` upfront with planned helpers.** Speculative;
  Scout's only confirmed shared helper is `discoverPackages`. Build it
  when needed.
- **Inline duplication as a permanent stance.** Unmaintainable past ~5
  tools.

### g. CI integration

**Decision: wire `tools:ci` into root `:ci` immediately as part of the
first roadmap task. Every new tool must (1) add a moon task, (2) be
covered by `tools:test`, (3) be part of `tools:ci`'s deps.**

Scout §5 risk #7 is explicit: today a tool's tests can break and
shared-configs's CI passes. This is fixed by adding `tools:ci` to root
`moon.yml`'s `:ci` task `deps`. This is a one-line change that gates
the rest of the roadmap.

Required wiring for every new tool, codified here and tested by the
`audit-tools-shape` tool (see §4):

1. New file at `tools/<name>.ts` (executable, shebang, parseArgs).
2. New file at `tools/<name>.test.ts` (bun:test).
3. New task in `tools/moon.yml` if the tool needs CLI invocation (some
    helpers may not).
4. Updated `tools:check` task includes `<name>.ts` and `<name>.test.ts`.
5. (If consumer-facing) New reusable workflow at
   `.github/workflows/<name>.yml` pinned at `@v1`.
6. (If consumer-facing) Update `docs/workflows.md` (per design spec
   §2 architecture).

Rejected alternative: **make CI wiring optional, document as a
should.** Tools that aren't in CI rot. Make it required.

### h. The mega-question — CLI suite, library, or both?

**Decision: tools are CLI-first in v0.x, with library surface emerging
opportunistically. At v1.0, publish the library surface as
`@fellwork/tools` while keeping CLI scripts git-cloned.**

This is the synthesis of Decisions a, d, and f. The v0.x picture:

- Each tool is a single `.ts` file with `main()` at the bottom.
- Shared logic moves to `tools/lib/` (Decision f).
- Nothing is npm-published (Decision d).
- Consumer repos invoke via reusable workflows (Decision c).

The v1.0 picture (anticipated, not committed):

- `tools/` exports a stable library surface as `@fellwork/tools`.
- Foreman imports `@fellwork/tools/kinds` to read manifests instead of
  reimplementing the parser.
- Bootstrap imports `@fellwork/tools/fleet` for inventory operations.
- Reusable workflows still git-clone (no version skew between workflow
  tag and npm tag).
- A thin `tools/fw.ts` dispatcher routes subcommands to the existing
  single-file scripts (Decision a's revisit).

Rejected alternatives:

- **Library-first now.** Forces a publish pipeline before two consumers
  exist (foreman is empty, per Scout §2.maintenance).
- **CLI-only forever.** Misses the obvious win where foreman wants to
  parse kind manifests using the same code shared-configs uses.

---

## 3. Tool taxonomy

Scout's maintenance / configuration / management / security /
implementation slicing is descriptively useful but doesn't predict
*ownership*. We replace it with a taxonomy keyed to **what artifact the
tool reads or produces**, since that's what determines whether a tool
belongs in shared-configs/tools/ at all.

### Category A — Manifest tools

Operate on `kinds/*.yaml` and `kinds/_schema.json`.

- Validators (existing: `validate-kinds.ts`).
- Schema migrators when the manifest schema evolves.
- Manifest diff tools (kind-vs-kind, version-vs-version).
- Kind-graph tools ("which packages does ts-library inherit from
  ts-base?").

### Category B — Repo-shape tools

Operate on a *consumer repo's* presence/absence of files vs. the
contracts a kind declares.

- Existing: `verify-repo-shape.ts`.
- Stricter mode (content check, not just presence).
- Drift report (foreman-style preview without writing).

### Category C — Package-suite tools

Operate on `packages/*` (the `@fellwork/*` npm scope).

- Workspace package discovery (the `discoverPackages()` helper).
- Trust-audit (verify which packages are registered as OIDC trusted
  publishers — see fate of trust-publishers below).
- Orphan detection (packages no kind references).
- Version-drift report (which kinds reference stale versions).

### Category D — Template tools

Operate on `templates/*` (the file-copy assets foreman consumes).

- Template integrity check (no broken cross-references, all `.tmpl`
  files declared placeholders are resolvable).
- Template diff against a consumer-repo snapshot.
- (Excluded: a templating engine — Decision 8 of design spec.)

### Category E — Workflow tools

Operate on `.github/workflows/*` and the `@v1` major-tag pinning model.

- Tag-mover for `@v1`/`@v2` major refs (Scout §2.maintenance flags this
  as Phase 6 / not yet built).
- Workflow inventory (which workflows ship, which consumers reference
  them).
- Reusable-workflow-input shape validation.

### Category F — Self-hygiene tools

Operate on `tools/` itself.

- `audit-tools-shape` (the meta-tool that enforces §2.g).
- `tools-doctor` (verify each tool conforms to the conventions).

### Category G — Boundary tools

Operate on the `shared-configs ↔ foreman` and `shared-configs ↔ bootstrap`
seams from the shared-configs side. These tools **read** `.foreman.lock`
or bootstrap's repo list, but **never write** them.

- Lockfile inspector (read `.foreman.lock`, report kind + scaffold-time
  SHA, but don't reconcile).
- Fleet-aware audit (when bootstrap can hand us the repo list, run any
  Category B/C audit across all repos).

Categories E and G overlap with bootstrap's future capabilities (Scout
§5 risk #5). The rule: **shared-configs tools that operate fleet-wide
must take the repo list as input from bootstrap; they must not
enumerate the fleet themselves.**

---

## 4. The roadmap

15 tools, prioritized into v0.1 / v0.2 / v1.0 / future. Every tool
traces to a Scout §2 concern.

| # | Tool name | Tier | Cat | Type | Complexity | Depends on | Purpose |
|---|---|---|---|---|---|---|---|
| 1 | `audit-tools-shape` | v0.1 | F | new | S | — | Enforce §2.g checklist on every tool in `tools/` (CI gate). |
| 2 | `wire-tools-ci` (one-shot patch, not a tool) | v0.1 | — | infra | S | — | Add `tools:ci` to root `:ci` deps (closes Scout §5 risk #7). |
| 3 | `discoverPackages` (helper, not a CLI) | v0.1 | C | new lib | S | — | First inhabitant of `tools/lib/`. Enables tools 4 + 5. |
| 4 | `trust-audit` | v0.1 | C | repurpose | M | 3 | Audit which `@fellwork/*` packages are registered as trusted publishers (replaces trust-publishers WIP — see §5 below). |
| 5 | `verify-repo-shape --strict` | v0.2 | B | evolution | M | — | Add content checks (tsconfig actually extends `@fellwork/tsconfig/*`, biome.json extends `@fellwork/biome-config/*`) without breaking the @v1 CLI contract. |
| 6 | `validate-kinds --diff` | v0.2 | A | evolution | S | — | Diff two kind-manifest snapshots; enables schema migration tracking. |
| 7 | `tag-workflows` | v0.2 | E | new | M | — | Move `@v1`/`@v2` major refs forward when reusable workflows change BC. Closes Scout §2.maintenance "not yet built." |
| 8 | `kinds-graph` | v0.2 | A | new | S | — | Print the `extends:` graph; report which kind owns which package/template/workflow. Powers docs generation. |
| 9 | `package-orphans` | v0.2 | C | new | S | 3 | Report `@fellwork/*` packages no kind manifest references — candidates for deprecation. |
| 10 | `tools-doctor` | v0.2 | F | new | S | 1 | Convention conformance scan: shebang, parseArgs, biome-ignore idiom, exit-code contract. |
| 11 | `template-integrity` | v0.2 | D | new | M | — | Validate every `.tmpl` placeholder resolves; no template references a missing kind. |
| 12 | `kind-migrate` | v1.0 | A | new | L | 6 | Apply codemods to consumer-repo `.foreman.lock` references when a kind manifest schema breaks. Nx-migrations model. |
| 13 | `lockfile-inspect` | v1.0 | G | new | M | 3 | Read `.foreman.lock` from a consumer-repo path; report kind + scaffold-SHA + drift indicators. Read-only. |
| 14 | `version-drift-report` | v1.0 | C | new | M | 3, 13 | For a given fleet repo list (passed in), report which `@fellwork/*` versions each consumer pins vs. latest. |
| 15 | `onboard-repo` | v1.0 | B | new | L | 5, 8 | Adopt a config-orphan repo (e.g., `scribe`) into the ecosystem: assign a kind, generate the changeset for `.foreman.lock`, run verify-repo-shape, emit a checklist. **Does not write `.foreman.lock` itself** (foreman owns that); emits a foreman-runnable adoption plan. |
| 16 | `workflow-inventory` | future | E | new | M | 7 | For a fleet repo list, report which reusable workflows each repo references and at what major tag. |
| 17 | `cli-help-aggregator` | future | F | new | S | 1, 10 | Print a unified `--help` index across all tools. Stepping stone to the v1.0 mega-CLI dispatcher (Decision 2.a). |

**Counts:** v0.1 = 4 items (1 infra patch + 3 tools), v0.2 = 7 tools,
v1.0 = 4 tools, future = 2 tools. Item 2 is included in v0.1 because it
unblocks Item 1. Item 3 is a library helper, not a CLI; it's listed
because it's the first `tools/lib/` inhabitant and gates Items 4, 9,
13, 14.

### Disposition of `trust-publishers.ts` (Item 4)

**Decision: repurpose as `trust-audit`. Discard the bulk-register
flow.**

Per Scout §4: the bulk-register use case was superseded by `npm trust
github` shipping natively. The audit use case has *recurring* value but
**`npm trust list` cannot run in CI due to EOTP** (Scout §2.security,
§4 explicitly).

The fix: `trust-audit` does NOT shell out to `npm trust list`. Instead
it reads the npm registry's HTTP API directly (`/npm/api/v1/...` —
specific endpoint to be confirmed during writing-plans for tool 4) to
fetch the trusted publisher metadata for each `@fellwork/*` package. No
EOTP, no interactive flow, runs in CI.

The branch `tools/trust-publishers` stays as a study artifact (Scout §5
risk #9). The new tool ships as `tools/trust-audit.ts` on `main` when
implemented. The `discoverPackages()` function from the WIP is the
seed for `tools/lib/discover-packages.ts` (Item 3).

### Disposition of `scribe` as a config orphan

**Decision: covered by Item 15 (`onboard-repo`). Not ignored.**

Per Scout §2.config, `scribe` has no kind manifest, no CLAUDE.md, and
uses vitest + a different biome version. Item 15 is the tool that
makes adopting an orphan repo into the ecosystem a structured operation
rather than a bespoke effort. It sits in v1.0 because:

- It depends on Item 5 (strict verify) being able to report adoption
  gaps.
- It depends on Item 8 (kinds-graph) so it can show the user "here's
  what `ts-application` would land in your repo."
- Foreman must exist and implement adopt-flow before this tool's output
  can be consumed end-to-end. Per design spec phase 8/9, that's the
  right horizon.

Until Item 15 ships, scribe stays a documented config-orphan exception
(Scout §5 risk #10). No tool fleet-iterates over it without an explicit
opt-out.

---

## 5. The first three tools — one-pager specs

Lightweight one-pagers to seed `writing-plans` for the v0.1 batch. The
fourth v0.1 deliverable (item 2, `wire-tools-ci`) is a one-line moon.yml
patch and does not need a one-pager.

### 5.1 `audit-tools-shape` (Item 1)

**Goal.** Enforce the §2.g convention checklist as a CI gate. Run by
`tools:ci`. Fails on any tool in `tools/*.ts` that doesn't conform.
Removes the human burden of remembering the rules.

**CLI shape.**
```
bun run tools/audit-tools-shape.ts [--fix]
```
- No required args. Reads the `tools/` directory directly.
- `--fix` (v0.2, not v0.1): emit suggested patches; do not apply.

**Inputs.**
- `tools/*.ts` (the source files themselves).
- `tools/moon.yml` (task names referenced).
- `.github/workflows/*.yml` (reusable workflows referenced).
- No kind manifests; this tool is about tools, not consumers.

**Outputs.**
- stdout: per-tool pass/fail with reason codes.
- exit 0 if all pass, 1 if any fail (work to do), 2 if `tools/`
  directory itself is unreadable (bad input).
- Format follows existing convention: section headers, leading
  `tools/<name>.ts`, then bulleted findings.

**Checklist enforced.**
- File has shebang `#!/usr/bin/env bun` and is executable bit set
  (where filesystem supports it; on Windows, the bit is informational).
- File uses `parseArgs` from `node:util` (not commander, yargs,
  clipanion).
- Every `console.*` call has an immediately preceding biome-ignore
  comment (idiom enforced by shared biome config).
- Colocated `tools/<name>.test.ts` exists.
- `tools:check` task in `tools/moon.yml` includes `<name>.ts` and
  `<name>.test.ts`.
- Exit-code contract documented in a header doc comment (0/1/2 per
  Scout §6 conventions).

**Trade-offs the planner will face.**
- AST parsing vs. regex for the lint checks. Suggestion: regex first
  (the conventions are syntactically simple); upgrade to a real parser
  if false positives bite.
- How strict to be about the biome-ignore idiom. Suggestion: require
  the exact string `// biome-ignore lint/suspicious/noConsole: CLI script`
  to keep the check trivially correct. Rejected: matching any
  biome-ignore (too permissive).
- Whether to enforce that consumer-facing tools have a reusable
  workflow. Suggestion: yes for v0.1 with a one-tool allowlist (so
  helpers in `tools/lib/` aren't flagged).

**Open questions.**
- How to test the linter on Windows where the executable bit isn't
  meaningful? Likely: skip that check on `process.platform === 'win32'`
  with an info-level note.

### 5.2 `discoverPackages` (Item 3) — library helper

**Goal.** Provide a single canonical implementation of "given a repo
root, list its workspace packages with `name`, `version`, `path`,
`isPrivate`." Replaces the TODO function in the trust-publishers WIP
(Scout §4). Consumed by tools 4, 9, 13, 14.

**Surface.** Library, not CLI. Lives at
`tools/lib/discover-packages.ts`. Exported as:

```ts
interface DiscoveredPackage {
  name: string
  version: string
  path: string         // absolute
  isPrivate: boolean
}

export function discoverPackages(repoRoot: string): DiscoveredPackage[]
```

**Inputs.**
- `repoRoot` — absolute path to a repo containing `package.json` with a
  `workspaces` field.
- Reads `package.json`, then each globbed workspace dir's
  `package.json`.

**Outputs.**
- Returns array of packages. Skips private packages without a `name`.
- Throws if `repoRoot/package.json` is missing or malformed (caller
  decides exit code).
- Order: deterministic — workspace-glob order, then directory-listing
  order within each glob.

**Tests.** `tools/lib/discover-packages.test.ts` with fixtures for
shared-configs's actual layout, plus a synthetic fixture covering
private-package skipping and missing-name handling.

**Trade-offs the planner will face.**
- Glob support: shared-configs only uses static workspace lists today
  (`packages/*`), but Scout §4's spec says "glob each entry." Use the
  built-in bun glob or add a tiny dependency? Suggestion: bun's `Glob`
  if available; fall back to readdir match.
- Caching: probably not worth it at v0.1 scale; revisit if a fleet-wide
  audit becomes slow.

**Open questions.**
- Should we surface peer-deps and devDeps too? Suggestion: no, that's
  the consumer's job; this helper is just enumeration.

### 5.3 `trust-audit` (Item 4)

**Goal.** Verify that every `@fellwork/*` package in the workspace is
registered as a GitHub Actions OIDC trusted publisher pointing at the
correct repo + workflow. Runs in CI without EOTP. Reports drift.

**CLI shape.**
```
bun run tools/trust-audit.ts [--workflow <name>] [--repo <owner/repo>]
```
- `--workflow` defaults to `release.yml` (matches design spec §5).
- `--repo` defaults to autodetect from `git remote get-url origin`
  (same regex as the trust-publishers WIP).

**Inputs.**
- `discoverPackages(repoRoot)` (Item 3) for the package list.
- npm registry HTTP API for trusted publisher metadata (no `npm trust
  list`; that requires EOTP per Scout §2.security).
- Git remote for repo autodetect.

**Outputs.**
- stdout: per-package status — `OK` / `MISMATCH (expected X, got Y)` /
  `MISSING (no trusted publisher registered)`.
- exit 0 if all packages match; 1 if any mismatch or missing; 2 on bad
  input or unreachable registry.

**Trade-offs the planner will face.**
- Exact npm registry API endpoint for trusted publisher metadata.
  Confirm during writing-plans; if no public endpoint exists (npm has
  historically not exposed this), the tool ships as a *manifest-only*
  audit (verify the reusable workflow's permissions block is OIDC-only)
  and the registry-side audit is deferred. **Document this fork
  explicitly in the implementation plan.**
- How to surface results to a human reviewing CI output. Suggestion:
  table with package / status / expected / actual.
- Caching across CI runs. Suggestion: don't; audit is on-demand.

**Open questions.**
- Does the npm registry expose trusted publisher state in a public
  unauth endpoint, an authed endpoint with a granular read-token, or
  not at all?
- If only authed: where does the read-token live? Probably a granular
  read-only token in the `audit-trust` workflow's secrets, **separate
  from publish credentials** (which remain OIDC-only per Scout §6).
  This is a deviation from "no long-lived secrets" and must be
  re-decided by the user when writing-plans hits this question.

---

## 6. Non-goals

What's explicitly out of scope for the next 12 months:

- **Cross-ecosystem tools that operate on non-Fellwork repos.** Tools
  read `kinds/*.yaml` for shape definitions; they don't synthesize
  generic project shape rules.
- **A web UI / dashboard.** Tools are CLI-first per Decision c.
- **Replacing moon as the task runner.** Moon stays the orchestrator
  (per Scout §3 "moon already plays this role").
- **A custom MCP server for tools/.** Tools expose CLI + (eventually)
  library surfaces. An MCP wrapper is a follow-on after v1.0 if needed
  and lives outside `tools/`.
- **Re-implementing changesets, cruft, biome, oxlint, renovate, or any
  third-party config tool.** Tools integrate with these, not replace
  them.
- **A fleet runner.** Bootstrap owns fleet enumeration (Decision 13 of
  design spec).
- **`.foreman.lock` writers.** Foreman owns the file (Appendix B of
  design spec, Scout §5 risk #5). Tools may *read* it (Item 13) but
  must never write.
- **Templating engine inside `tools/`.** Decision 8 of design spec
  forbids it; templates stay plain files.
- **A `@fellwork/tools` npm publish in v0.x.** Decision 2.d defers it.
- **Tools targeting languages beyond TS and Rust.** Out of scope per
  design spec §1.

---

## Appendix A — Decisions log

| # | Decision | Rationale |
|---|---|---|
| 1 | Tools' mission: read/validate/audit/inventory shared-configs's contracts; don't duplicate bootstrap or foreman's roles | Cleaner ownership lines mean every future tool decision has a fast yes/no answer (§1) |
| 2 | Stay single-file-per-tool through v0.x; revisit mega-CLI dispatcher at v1.0 once tool count ≥ 8 | Two tools fit single-file fine; bundling now would break `verify-repo-shape.yml@v1` invocation contract (Scout §6) |
| 3 | Configuration comes from CLI args + autodetect first, kind manifests second; no per-tool config files, no `fellwork.toml` | Single authority surface; kind manifests already encode the cross-cutting facts (§2.b) |
| 4 | `bun run tools/<name>.ts` is local invocation; `moon run tools:<name>` is internal CI; reusable workflows are consumer CI | Each surface fits its consumer; no surface dominates (§2.c) |
| 5 | Tools are NOT npm-published in v0.x | Matches `verify-repo-shape.ts` model; avoids a publish pipeline before consumers exist (§2.d, Scout §6) |
| 6 | Lock in colocated `*.test.ts` + bun:test + execSync convention | Two shipped tools and the WIP all conform; convention is stable (§2.e, Scout §1) |
| 7 | Lazy `tools/lib/` extraction; copy until a second consumer needs the same code; rule of two | Avoids speculative library; first inhabitant is `discoverPackages` (§2.f) |
| 8 | Wire `tools:ci` into root `:ci` immediately; every new tool must add moon task + test + (if consumer-facing) reusable workflow | Closes Scout §5 risk #7 today; codifies the contract for new tools (§2.g) |
| 9 | CLI-first in v0.x; library surface emerges; publish `@fellwork/tools` library at v1.0 with CLI scripts still git-cloned | Synthesizes 2 + 5 + 7; gives foreman/bootstrap a clean import path without forcing a publish pipeline now (§2.h) |
| 10 | Tool taxonomy keyed to artifacts (manifests, repo-shape, packages, templates, workflows, self, boundary), not Scout's read-flavored slicing | Artifact-keyed taxonomy predicts ownership; flavor-keyed taxonomy doesn't (§3) |
| 11 | Fleet-wide tools take the repo list as input; never enumerate the fleet themselves | Bootstrap owns enumeration (Decision 13 of design spec); duplicating it here re-opens a closed question (§3) |
| 12 | Repurpose `trust-publishers` WIP as `trust-audit`; discard bulk-register; keep the WIP branch as a study artifact | Bulk-register is superseded by `npm trust github`; audit has recurring value; CI must use registry HTTP API (no EOTP) (§4 Item 4, §5.3) |
| 13 | `scribe` adoption is covered by Item 15 (`onboard-repo`); not ignored, not a tools/-day-1 problem | Adoption needs strict verify (Item 5) and kinds-graph (Item 8) to exist first; placing it at v1.0 sequences correctly (§4) |
| 14 | The `discoverPackages()` shape from the WIP becomes `tools/lib/discover-packages.ts` — first inhabitant of the lib dir | Scout §4 named this as the most reusable extracted helper; rule-of-two satisfied by Items 4, 9, 13, 14 all needing it (§2.f, §5.2) |
| 15 | New tools must include `tools:ci` membership and reusable-workflow file (when consumer-facing); enforced by `audit-tools-shape` | Without enforcement, conventions rot (Scout §5 risk #11 emoji-policy is a precedent); the meta-tool gates the rest (§4 Item 1) |

---

## Appendix B — Open questions deferred to implementation

These resolve during writing-plans for the affected tool, not in the
spec.

- **Exact npm registry HTTP API endpoint for trusted publisher
  metadata.** If no public endpoint exists, `trust-audit` (Item 4)
  ships as workflow-only audit and the registry-side audit is deferred
  to "future" with an issue tracking npm's API surface. (§5.3 open
  question.)
- **Granular read-token storage if `trust-audit` needs authed
  endpoints.** This is a deviation from "no long-lived secrets" and
  the user must approve it before the implementation plan ships.
- **AST vs. regex inside `audit-tools-shape` (Item 1).** Start regex,
  upgrade if false positives bite. (§5.1 trade-off.)
- **Glob library for `discoverPackages`.** bun's built-in `Glob`
  preferred; fallback to readdir if unavailable. (§5.2 trade-off.)
- **Naming the v1.0 dispatcher.** `fw`, `fwc`, `fellwork-tools`,
  `tools/cli.ts` — defer to v1.0 writing-plans cycle. (§2.a revisit.)
- **When v1.0 publishes `@fellwork/tools`.** Tied to foreman shipping;
  if foreman lands on the same release, co-publish. If not, defer.
- **Cargo-side equivalents.** Items 1–17 are all TS-side. A future
  pass may identify Rust-side tools (e.g., a Cargo workspace
  inventory tool). Out of scope for this roadmap; revisit when
  `templates/rust/.fw-domain-lint.toml` migration completes (design
  spec phase 5) and the Rust-side surface stabilizes.
- **Whether to enforce emoji policy (Scout §5 risk #11).** The
  `audit-tools-shape` tool could enforce no-glyph; the existing tools
  use `✓` / `✗`. Decide during Item 1 writing-plans whether to
  grandfather or migrate.

---

## Appendix C — Glossary

- **Tool.** A single-purpose executable script under
  `shared-configs/tools/`, conforming to §2.g conventions. CLI-first;
  may also export a library surface (Decision 9).
- **Library helper.** A non-CLI module under `tools/lib/` exporting
  reusable functions; imported by multiple tools. No shebang, no
  top-level side effects on import.
- **Command.** A subcommand of a future v1.0 dispatcher. In v0.x,
  every tool is its own top-level command; the term is reserved for
  the future.
- **Workflow.** A GitHub Actions YAML file. *Reusable workflow* =
  `.github/workflows/*.yml` invoked via `uses:` from a consumer; pinned
  by major-version tag.
- **Fleet.** The set of Fellwork repos enumerated by bootstrap's
  `repos.psd1`. Tools never enumerate it themselves (Decision 11).
- **Kind.** A repo-type identifier (e.g., `ts-library`, `rust-workspace`)
  defined in `kinds/<kind>.yaml`. Kind = filename = `kind:` field
  (validator-enforced).
- **Manifest.** A `kinds/*.yaml` file. Schema is `kinds/_schema.json`.
- **Surface.** A way of invoking a tool (local bun, moon task,
  reusable workflow, future npm bin). Each tool may have multiple
  surfaces; each surface has a canonical use case (§2.c).
- **Trusted publisher.** An npm-registry-side OIDC binding that
  authorizes a specific GitHub repo + workflow path to publish a
  specific package without a long-lived `NPM_TOKEN` (design spec
  Decision 10).
- **Consumer repo.** A Fellwork repo that consumes shared-configs
  artifacts (kinds, packages, templates, workflows). All Fellwork
  sibling repos are consumers; shared-configs is a self-consumer.
- **`.foreman.lock`.** A file written by foreman in a consumer repo
  recording the kind it claims and the shared-configs SHA it was
  scaffolded from. Foreman owns the schema (design spec Appendix B);
  shared-configs tools may *read* it but must never write.
