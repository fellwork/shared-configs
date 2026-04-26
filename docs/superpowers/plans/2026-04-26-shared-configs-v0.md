# shared-configs v0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `fellwork/shared-configs` to v0 — the canonical home for shared dev configs across the Fellwork ecosystem (9 published `@fellwork/*` npm packages, file-copy templates, reusable GitHub workflows, kind manifests).

**Architecture:** A bun + biome + changesets + moon monorepo. Three asset categories: (1) npm-published packages under `packages/`, (2) file-copy assets under `templates/`, (3) reusable GitHub Actions workflows under `.github/`. Kind manifests in `kinds/` describe what foreman should install for each repo type.

**Tech Stack:** bun (runtime + package manager + publisher), biome (lint/format), oxlint (broad lint sweep), changesets (versioning), moon (task orchestrator), proto (pinned tool versions), GitHub Actions (CI/release with npm trusted publishing / OIDC).

**Scope:** Phases 0–7 of the spec (build the repo to v0). Phases 8–10 (adoption in api/web/etc., deprecation of old repos) are deferred to a follow-up plan.

**Worktree:** This plan executes in `c:/git/fellwork-worktrees/shared-configs-v0` on branch `shared-configs/v0`. The `c:/git/fellwork/shared-configs` checkout (on `main`) is left untouched.

**Spec:** See [`docs/superpowers/specs/2026-04-26-fellwork-shared-configs-design.md`](../specs/2026-04-26-fellwork-shared-configs-design.md).

---

## Important conventions

- **All commits use Conventional Commits** with the type list from the existing `commitlint.config.cjs`: `add, breaking, build, chore, chore-deps, chore-release, ci, config, docs, feat, fix, i18n, perf, refactor, release, remove, revert, security, style, test`. The plan picks types per task.
- **Version line continuity:** `@fellwork/tsconfig` exists at `0.1.0` on npm and `@fellwork/biome-config` at `0.1.6`. The fold-in moves both to `0.2.0` from the new repo (a minor bump representing the move, not a rewrite). The 7 net-new packages start at `0.1.0`.
- **Each package's first publish is bootstrapped manually** with a granular npm token from a maintainer's laptop, then trusted publishing (OIDC) takes over for all subsequent CI publishes (per spec §5).
- **No changesets are consumed in this plan.** Changesets are *added* throughout, but the actual `changeset version` + `changeset publish` happens at the end of Phase 7 as the plan's final shipping step.

---

## Phase 0 — Reset the scaffold

The current `shared-configs` repo is a fork-template residue: pnpm 6, babel, husky, eslint+prettier, abandoned package stubs. Phase 0 strips it down and replaces the toolchain with bun + biome + changesets + moon.

### Task 0.1: Delete obsolete tooling files

**Files:**
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/.eslintignore`
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/.eslintrc`
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/.lintstagedrc`
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/.prettierrc`
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/commitlint.config.cjs`
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/pnpm-lock.yaml`
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/pnpm-workspace.yaml`
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/packages/release-config/`
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/packages/shared/`
- Delete: `c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/`

- [ ] **Step 1: Verify worktree is clean and on the correct branch**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git status
git branch --show-current
```
Expected: working tree clean (or only the unrelated `.vscode/settings.json` modification carried over from main); branch is `shared-configs/v0`.

- [ ] **Step 2: Delete obsolete tooling files**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
rm .eslintignore .eslintrc .lintstagedrc .prettierrc commitlint.config.cjs pnpm-lock.yaml pnpm-workspace.yaml
rm -rf packages/release-config packages/shared packages/tsconfig
```

- [ ] **Step 3: Verify deletions**

```bash
ls c:/git/fellwork-worktrees/shared-configs-v0
ls c:/git/fellwork-worktrees/shared-configs-v0/packages
```
Expected: no eslint/prettier/lintstaged/commitlint/pnpm files; `packages/` directory empty (or not present).

- [ ] **Step 4: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add -A
git commit -m "remove(repo): drop pnpm/eslint/prettier/husky toolchain and abandoned package stubs"
```

### Task 0.2: Write the new root `package.json`

**Files:**
- Modify: `c:/git/fellwork-worktrees/shared-configs-v0/package.json`

- [ ] **Step 1: Replace `package.json` with the bun + changesets shape**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/package.json`:

```json
{
  "name": "shared-configs",
  "description": "Canonical home for shared developer configs across the Fellwork ecosystem",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "engines": {
    "bun": ">=1.1.0"
  },
  "scripts": {
    "ci": "moon run :ci",
    "release": "moon run :release",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "format": "biome format --write .",
    "check": "biome check .",
    "lint": "biome lint . && oxlint ."
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.13",
    "@changesets/cli": "^2.27.0",
    "@changesets/changelog-github": "^0.5.0",
    "oxlint": "^0.15.0",
    "typescript": "^5.6.2"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun install
```
Expected: `bun.lock` is created; `node_modules/` populated; no errors.

- [ ] **Step 3: Verify the toolchain binaries are reachable**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome --version
bunx changeset --version
bunx oxlint --version
```
Expected: each prints a version. If any fails, re-run `bun install`.

- [ ] **Step 4: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add package.json bun.lock
git commit -m "config(repo): bun-native package.json with biome, changesets, oxlint devDeps"
```

### Task 0.3: Add proto and moon configuration

**Files:**
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/.prototools`
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/.moon/toolchain.yml`
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/.moon/workspace.yml`
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/moon.yml`

- [ ] **Step 1: Create `.prototools`**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/.prototools`:

```toml
bun = "1.1.42"
node = "22.12.0"
moon = "1.30.0"
```

- [ ] **Step 2: Create `.moon/toolchain.yml`**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/.moon
```

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/.moon/toolchain.yml`:

```yaml
$schema: 'https://moonrepo.dev/schemas/toolchain.json'

bun:
  version: '1.1.42'

node:
  version: '22.12.0'
  packageManager: 'bun'
```

- [ ] **Step 3: Create `.moon/workspace.yml`**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/.moon/workspace.yml`:

```yaml
$schema: 'https://moonrepo.dev/schemas/workspace.json'

projects:
  - 'packages/*'

vcs:
  client: 'git'
  defaultBranch: 'main'
```

- [ ] **Step 4: Create root `moon.yml`**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/moon.yml`:

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

tasks:
  ci:
    command: 'noop'
    deps:
      - '~:check'
      - 'packages.*:check'
      - 'packages.*:test'

  check:
    command: 'bunx biome check .'
    inputs:
      - '**/*.{json,jsonc,ts,tsx,md,yaml,yml}'
      - '!packages/**'
      - '!templates/**'

  release:
    command: 'bunx changeset publish'
    options:
      runInCI: false
```

- [ ] **Step 5: Verify moon parses the workspace**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx moon query projects
```
Expected: prints the root project (no package projects yet — they'll be added in later phases). If moon errors on missing tools, run `proto use` first to install them.

- [ ] **Step 6: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add .prototools .moon moon.yml
git commit -m "config(repo): add proto + moon toolchain pinning"
```

### Task 0.4: Add biome and tsconfig at the root

**Files:**
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/biome.json`
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/tsconfig.json`

- [ ] **Step 1: Create root `biome.json`**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.13/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "includes": [
      "**",
      "!bun.lock",
      "!node_modules",
      "!**/node_modules",
      "!**/dist",
      "!**/.tsbuildinfo",
      "!**/CHANGELOG.md"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

> **Note:** This biome config is hand-written for now. Once `@fellwork/biome-config` is folded in (Phase 2) and self-published, the root `biome.json` will be rewritten in Task 2.5 to extend `@fellwork/biome-config/base`.

- [ ] **Step 2: Create root `tsconfig.json`**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/tsconfig.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["scripts/**/*.ts", "tools/**/*.ts"]
}
```

> **Note:** Once `@fellwork/tsconfig` is folded in (Phase 1), this file will be rewritten in Task 1.5 to extend `@fellwork/tsconfig/node`.

- [ ] **Step 3: Run biome check**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check .
```
Expected: passes (no files to lint yet beyond the configs themselves).

- [ ] **Step 4: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add biome.json tsconfig.json
git commit -m "config(repo): add root biome and tsconfig (hand-written, replaced in Phases 1-2)"
```

### Task 0.5: Add changesets configuration

**Files:**
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/.changeset/config.json`
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/.changeset/README.md`

- [ ] **Step 1: Create `.changeset/` directory and config**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/.changeset
```

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "fellwork/shared-configs" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 2: Create `.changeset/README.md`**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/.changeset/README.md`:

```markdown
# Changesets

Hello! This directory has been automatically generated by `@changesets/cli`. We use it to track which packages need to be released.

## Adding a changeset

To add a changeset, run:

```bash
bun run changeset
```

Pick the affected packages, the bump type (patch / minor / major), and write a one-line summary. The summary becomes a CHANGELOG entry.

## Releasing

Releases happen automatically via `.github/workflows/release.yml` on push to `main`. The workflow uses npm trusted publishing (OIDC) — no `NPM_TOKEN` secret is involved. See `docs/superpowers/specs/2026-04-26-fellwork-shared-configs-design.md` §5 for the full release model.
```

- [ ] **Step 3: Verify changesets recognises the config**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx changeset status
```
Expected: prints something like "no changesets present" (no errors). If it errors on missing packages, that's expected too — Phase 1 adds the first package.

- [ ] **Step 4: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add .changeset
git commit -m "config(repo): initialize changesets with public access and github changelog"
```

### Task 0.6: Refresh `.gitignore` and add `.gitattributes`

**Files:**
- Modify: `c:/git/fellwork-worktrees/shared-configs-v0/.gitignore`
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/.gitattributes`

- [ ] **Step 1: Replace `.gitignore` with bun-native ignores**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/.gitignore`:

```gitignore
# bun
node_modules/
bun.lockb

# build outputs
dist/
.tsbuildinfo
*.tsbuildinfo

# moon
.moon/cache/
.moon/docker/

# editor
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# env
.env
.env.local
.env.*.local

# logs
*.log
npm-debug.log*
```

- [ ] **Step 2: Create `.gitattributes`**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/.gitattributes`:

```gitattributes
* text=auto eol=lf

*.json     text eol=lf
*.jsonc    text eol=lf
*.yaml     text eol=lf
*.yml      text eol=lf
*.md       text eol=lf
*.ts       text eol=lf
*.tsx      text eol=lf
*.js       text eol=lf
*.mjs      text eol=lf
*.cjs      text eol=lf
*.toml     text eol=lf

bun.lock   text eol=lf -diff
```

- [ ] **Step 3: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add .gitignore .gitattributes
git commit -m "config(repo): refresh .gitignore for bun, add .gitattributes for LF discipline"
```

### Task 0.7: Replace the README

**Files:**
- Modify: `c:/git/fellwork-worktrees/shared-configs-v0/README.md`

- [ ] **Step 1: Write the new README**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/README.md`:

```markdown
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
```

- [ ] **Step 2: Verify biome accepts the README**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check README.md
```
Expected: passes.

- [ ] **Step 3: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add README.md
git commit -m "docs(readme): rewrite for v0 toolchain and three-category model"
```

### Task 0.8: Phase 0 final verification

- [ ] **Step 1: Run the full check**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check .
bunx changeset status
ls -la
```
Expected: biome passes; changeset prints status (likely "no packages to release"); root contains `package.json`, `bun.lock`, `biome.json`, `tsconfig.json`, `moon.yml`, `.prototools`, `.moon/`, `.changeset/`, `.editorconfig`, `.gitignore`, `.gitattributes`, `.vscode/`, `LICENSE`, `README.md`, `docs/`, `packages/` (empty); no eslint/prettier/pnpm/husky residue.

- [ ] **Step 2: Verify git log shows Phase 0 commits**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git log --oneline shared-configs/v0 ^main
```
Expected: ~7 commits with messages like "remove(repo)", "config(repo)", "docs(readme)".

---

## Phase 1 — Fold in `@fellwork/tsconfig`

Move `c:/git/fellwork/tsconfig/` contents into `packages/tsconfig/`, bump version to `0.2.0`, add a moon project, and create the first changeset.

### Task 1.1: Create the package skeleton

**Files:**
- Create: `c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/{fixtures,scripts,docs}
```

### Task 1.2: Copy the four tsconfig presets

**Files:**
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/node.json`
- Create: `packages/tsconfig/browser.json`
- Create: `packages/tsconfig/library.json`

- [ ] **Step 1: Write `packages/tsconfig/base.json`**

Write this exact content (preserved from `c:/git/fellwork/tsconfig/base.json`):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "@fellwork/tsconfig/base",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023"],

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,

    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 2: Write `packages/tsconfig/node.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "@fellwork/tsconfig/node",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"]
  }
}
```

- [ ] **Step 3: Write `packages/tsconfig/browser.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "@fellwork/tsconfig/browser",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "DOM.Iterable"]
  }
}
```

- [ ] **Step 4: Write `packages/tsconfig/library.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "@fellwork/tsconfig/library",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": false,
    "outDir": "${configDir}/dist",
    "rootDir": "${configDir}/src",
    "tsBuildInfoFile": "${configDir}/.tsbuildinfo"
  }
}
```

### Task 1.3: Write `packages/tsconfig/package.json` and CHANGELOG

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/CHANGELOG.md`

- [ ] **Step 1: Write `packages/tsconfig/package.json`**

```json
{
  "name": "@fellwork/tsconfig",
  "version": "0.2.0",
  "description": "Shared TypeScript configurations for Fellwork projects.",
  "license": "MIT",
  "type": "module",
  "private": false,
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fellwork/shared-configs.git",
    "directory": "packages/tsconfig"
  },
  "homepage": "https://github.com/fellwork/shared-configs/tree/main/packages/tsconfig#readme",
  "bugs": {
    "url": "https://github.com/fellwork/shared-configs/issues"
  },
  "keywords": ["tsconfig", "typescript", "shared-config", "fellwork"],
  "files": [
    "base.json",
    "node.json",
    "browser.json",
    "library.json",
    "LICENSE",
    "README.md",
    "CHANGELOG.md"
  ],
  "exports": {
    ".": "./base.json",
    "./base": "./base.json",
    "./node": "./node.json",
    "./browser": "./browser.json",
    "./library": "./library.json",
    "./package.json": "./package.json"
  },
  "engines": {
    "bun": ">=1.3.0",
    "node": ">=20.18.0"
  },
  "peerDependencies": {
    "typescript": ">=5.5.0"
  },
  "peerDependenciesMeta": {
    "typescript": {
      "optional": false
    }
  },
  "devDependencies": {
    "@types/node": "^25.6.0"
  },
  "scripts": {
    "validate": "bun run scripts/validate.ts"
  }
}
```

> **Note:** `@types/node` is required for the `node` and `node-library` fixtures' source files (which import from `node:fs/promises` etc.). The fixtures will fail with `TS2307: Cannot find module 'node:fs/promises'` without it.

- [ ] **Step 2: Write `packages/tsconfig/CHANGELOG.md`**

```markdown
# @fellwork/tsconfig

## 0.2.0

### Minor Changes

- Folded into `fellwork/shared-configs` monorepo. Repo URL changed from `fellwork/tsconfig` to `fellwork/shared-configs`. Package contents and exports unchanged. The standalone `fellwork/tsconfig` repo is deprecated.

## 0.1.0

- Initial release. Four-preset shape: `base`, `node`, `browser`, `library`. Built on TS 5.5+ with `${configDir}` template variable support.
```

### Task 1.4: Copy the validate script and fixtures

**Files:**
- Create: `packages/tsconfig/scripts/validate.ts`
- Create: `packages/tsconfig/fixtures/base/tsconfig.json` + `src/index.ts`
- Create: `packages/tsconfig/fixtures/node/tsconfig.json` + `src/index.ts`
- Create: `packages/tsconfig/fixtures/browser/tsconfig.json` + `src/index.ts`
- Create: `packages/tsconfig/fixtures/node-library/tsconfig.json` + `src/index.ts`

- [ ] **Step 1: Copy `validate.ts` from the existing repo**

```bash
cp c:/git/fellwork/tsconfig/scripts/validate.ts c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/scripts/validate.ts
```

Verify content matches by reading the destination — content should be the script that walks `fixtures/` and runs `tsc` against each.

- [ ] **Step 2: Copy the fixtures directory**

```bash
cp -r c:/git/fellwork/tsconfig/fixtures/* c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/fixtures/
```

- [ ] **Step 3: Verify fixtures landed**

```bash
ls c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/fixtures/
```
Expected: `base`, `browser`, `node`, `node-library` directories, each containing `tsconfig.json` and `src/`.

- [ ] **Step 4: Update fixture tsconfigs to point at the new package paths if needed**

Read each fixture's `tsconfig.json`. They reference `@fellwork/tsconfig/...` via `extends`. Since the package name is unchanged, no edit is needed.

```bash
cat c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/fixtures/base/tsconfig.json
```
Expected: extends `@fellwork/tsconfig/base` (or similar). Confirm no `../../base.json` paths that would break in the new layout.

### Task 1.5: Add `packages/tsconfig/moon.yml`

**Files:**
- Create: `packages/tsconfig/moon.yml`

- [ ] **Step 1: Write `moon.yml`**

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'library'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check .'
    inputs:
      - '*.json'
      - 'fixtures/**/*.json'
      - 'fixtures/**/*.ts'
      - 'scripts/**/*.ts'

  test:
    command: 'bun run scripts/validate.ts'
    inputs:
      - '*.json'
      - 'scripts/validate.ts'
      - 'fixtures/**'

  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:test'
```

### Task 1.6: Copy the README and docs

**Files:**
- Create: `packages/tsconfig/README.md`
- Create: `packages/tsconfig/docs/usage.md`
- Create: `packages/tsconfig/docs/composition.md`
- Create: `packages/tsconfig/docs/migration.md`
- Create: `packages/tsconfig/LICENSE`

- [ ] **Step 1: Copy README, docs, and LICENSE from source repo**

```bash
cp c:/git/fellwork/tsconfig/README.md c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/README.md
cp c:/git/fellwork/tsconfig/LICENSE c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/LICENSE
cp c:/git/fellwork/tsconfig/docs/usage.md c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/docs/usage.md
cp c:/git/fellwork/tsconfig/docs/composition.md c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/docs/composition.md
cp c:/git/fellwork/tsconfig/docs/migration.md c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/docs/migration.md
```

- [ ] **Step 2: Update README's repo URLs from fellwork/tsconfig to fellwork/shared-configs**

Open `c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig/README.md`. Find any link like `https://github.com/fellwork/tsconfig` and replace with `https://github.com/fellwork/shared-configs/tree/main/packages/tsconfig`. Find the line `[docs/superpowers/specs/2026-04-25-fellwork-tsconfig-design.md]` near the bottom and update it to point at the spec inside the new repo: `../../../docs/superpowers/specs/2026-04-26-fellwork-shared-configs-design.md`.

If a more thorough rewrite of the README is needed, do it conservatively — keep the original "Pick a preset" / "Quick examples" / "Composition rules" sections intact, only change repo-relative URLs.

### Task 1.7: Run the package's own tests

- [ ] **Step 1: Install peer dependency at the root**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun add -d typescript@^5.6.2 @types/node@^25.6.0
```
(Already in root devDependencies from Task 0.2 — this is a no-op verification step.)

- [ ] **Step 2: Run the validate script**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0/packages/tsconfig
bun run scripts/validate.ts
```
Expected: prints "validating base", "validating browser", "validating node", "validating node-library" — all PASS — then "All 4 fixture(s) passed."

If a fixture fails, inspect the error. Likely cause: TypeScript can't resolve `@fellwork/tsconfig/...` because the package isn't yet linked. Run `bun install` from the worktree root to wire workspace symlinks and retry.

- [ ] **Step 3: Run biome check on the package**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check packages/tsconfig
```
Expected: passes.

### Task 1.8: Rewrite the root tsconfig.json to extend the folded-in package

**Files:**
- Modify: `c:/git/fellwork-worktrees/shared-configs-v0/tsconfig.json`
- Modify: `c:/git/fellwork-worktrees/shared-configs-v0/package.json` (add workspace devDep)

- [ ] **Step 1: Replace the root `tsconfig.json`**

Write this exact content (replaces the hand-written version from Task 0.4):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@fellwork/tsconfig/node",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["scripts/**/*.ts", "tools/**/*.ts"]
}
```

- [ ] **Step 2: Add the workspace package as a root devDependency**

Edit the root `package.json` to add `"@fellwork/tsconfig": "workspace:*"` to `devDependencies`. Bun does NOT create a `node_modules/@fellwork/tsconfig` symlink automatically just because the package is in the workspace — the root must depend on it explicitly. Without this, `tsc` cannot resolve `"extends": "@fellwork/tsconfig/node"` because tsc reads from `node_modules/`, not bun's internal workspace registry.

After editing, the root devDependencies should look like:

```json
"devDependencies": {
  "@biomejs/biome": "2.4.13",
  "@changesets/cli": "^2.27.0",
  "@changesets/changelog-github": "^0.5.0",
  "@fellwork/tsconfig": "workspace:*",
  "oxlint": "^0.15.0",
  "typescript": "^5.6.2"
}
```

- [ ] **Step 3: Verify TypeScript can resolve the extends**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun install
ls node_modules/@fellwork/tsconfig/base.json
```
Expected: lists the file (workspace symlink resolved). If `ls` says "No such file or directory", bun did not create the symlink — re-run `bun install` and verify root `package.json` has `@fellwork/tsconfig: "workspace:*"` in devDependencies.

> **Note:** `bunx tsc --showConfig` is NOT a useful verification here because the root tsconfig's `include: ["scripts/**/*.ts", "tools/**/*.ts"]` references directories that won't exist until Phase 7 (which creates `tools/verify-repo-shape.ts`). Until then, `tsc --showConfig` errors with TS18003 ("No inputs were found"). The symlink check above proves the same thing tsc would: `@fellwork/tsconfig/node` is reachable.

### Task 1.9: Add the changeset and commit Phase 1

**Files:**
- Create: `.changeset/fold-in-tsconfig.md`

- [ ] **Step 1: Add the changeset**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/.changeset/fold-in-tsconfig.md`:

```markdown
---
'@fellwork/tsconfig': minor
---

Folded into `fellwork/shared-configs` monorepo. Repo URL changed from `fellwork/tsconfig` to `fellwork/shared-configs`. Package contents and exports unchanged.
```

- [ ] **Step 2: Verify changesets recognises the bump**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx changeset status
```
Expected: prints "@fellwork/tsconfig will receive a minor bump".

- [ ] **Step 3: Commit Phase 1**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add packages/tsconfig .changeset/fold-in-tsconfig.md tsconfig.json bun.lock
git commit -m "feat(tsconfig): fold @fellwork/tsconfig into shared-configs as packages/tsconfig"
```

---

## Phase 2 — Fold in `@fellwork/biome-config`

Move `c:/git/fellwork/lint/packages/biome-config/` into `packages/biome-config/`, bump version to `0.2.0`, swap the root biome config to dogfood the new package.

### Task 2.1: Create the package skeleton

- [ ] **Step 1: Create the directory**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/{presets,extras,scripts,tests}
```

### Task 2.2: Copy presets and extras

- [ ] **Step 1: Copy preset JSON files**

```bash
cp c:/git/fellwork/lint/packages/biome-config/presets/*.json c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/presets/
```

- [ ] **Step 2: Verify all 7 presets landed**

```bash
ls c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/presets/
```
Expected: `base.json`, `lib.json`, `next.json`, `node.json`, `nuxt.json`, `react.json`, `vue.json`.

- [ ] **Step 3: Copy extras**

```bash
cp -r c:/git/fellwork/lint/packages/biome-config/extras/* c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/extras/
```

### Task 2.3: Copy tests fixtures and runner

- [ ] **Step 1: Copy tests directory**

```bash
cp -r c:/git/fellwork/lint/packages/biome-config/tests/* c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/tests/
```

- [ ] **Step 2: Verify**

```bash
ls c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/tests/
cat c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/tests/run-fixtures.ts
```
Expected: `fixtures/` directory and `run-fixtures.ts` file.

### Task 2.4: Write `packages/biome-config/package.json` and CHANGELOG

- [ ] **Step 1: Write `packages/biome-config/package.json`**

```json
{
  "name": "@fellwork/biome-config",
  "version": "0.2.0",
  "description": "Shared Biome configurations for Fellwork projects (presets for base, lib, node, react, vue, next, nuxt).",
  "keywords": [
    "biome",
    "biomejs",
    "biome-config",
    "shared-config",
    "shareable-config",
    "lint",
    "linter",
    "format",
    "formatter",
    "fellwork",
    "react",
    "vue",
    "nextjs",
    "nuxt",
    "typescript"
  ],
  "homepage": "https://github.com/fellwork/shared-configs/tree/main/packages/biome-config#readme",
  "bugs": {
    "url": "https://github.com/fellwork/shared-configs/issues"
  },
  "license": "MIT",
  "author": "Fellwork <shane@fellwork.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fellwork/shared-configs.git",
    "directory": "packages/biome-config"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "files": ["presets", "extras", "README.md", "LICENSE"],
  "exports": {
    "./base": "./presets/base.json",
    "./lib": "./presets/lib.json",
    "./node": "./presets/node.json",
    "./react": "./presets/react.json",
    "./vue": "./presets/vue.json",
    "./next": "./presets/next.json",
    "./nuxt": "./presets/nuxt.json"
  },
  "peerDependencies": {
    "@biomejs/biome": ">=2.0.0"
  }
}
```

- [ ] **Step 2: Write `packages/biome-config/CHANGELOG.md`**

```markdown
# @fellwork/biome-config

## 0.2.0

### Minor Changes

- Folded into `fellwork/shared-configs` monorepo. Repo URL changed from `fellwork/lint` to `fellwork/shared-configs`. Package contents and exports unchanged. The standalone `fellwork/lint` repo is deprecated.

## 0.1.6

- Last release from the `fellwork/lint` repo.
```

### Task 2.5: Add `packages/biome-config/moon.yml` and copy README + LICENSE

- [ ] **Step 1: Write `moon.yml`**

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'library'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check presets'
    inputs:
      - 'presets/**/*.json'

  test:
    command: 'bun run tests/run-fixtures.ts'
    inputs:
      - 'presets/**/*.json'
      - 'tests/**'

  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:test'
```

- [ ] **Step 2: Copy README and LICENSE**

```bash
cp c:/git/fellwork/lint/packages/biome-config/README.md c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/README.md
cp c:/git/fellwork/lint/LICENSE c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/LICENSE
```

- [ ] **Step 3: Update README repo URLs**

Open `c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config/README.md`. Replace any `https://github.com/fellwork/lint` with `https://github.com/fellwork/shared-configs/tree/main/packages/biome-config`.

### Task 2.6: Add the workspace package as a root devDep and run tests

- [ ] **Step 1: Add `@fellwork/biome-config: "workspace:*"` to root `package.json` devDependencies**

Same Bun-workspace-symlink reason as Task 1.8 step 2: without the explicit root devDep, biome cannot resolve `@fellwork/biome-config/base` in the root biome.json (Task 2.7).

After editing, root devDependencies should include:

```json
"@fellwork/biome-config": "workspace:*",
"@fellwork/tsconfig": "workspace:*",
```

- [ ] **Step 2: Re-install to create the workspace symlink**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun install
ls node_modules/@fellwork/biome-config/presets/
```
Expected: lists 7 JSON files (base, lib, next, node, nuxt, react, vue).

- [ ] **Step 3: Run fixtures**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0/packages/biome-config
bun run tests/run-fixtures.ts
```
Expected: `✓ all fixtures pass (7 presets)`. If any fail, inspect: most likely a fixture references a preset path that no longer matches the layout. Fix by editing the fixture's `biome.json` to point at the preset within this package.

- [ ] **Step 4: Run biome check on the package itself**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check packages/biome-config
```
Expected: passes. If biome reformats CRLF→LF or expands inline arrays from copied files, accept the reformats with `bunx biome check --write packages/biome-config` and re-run.

### Task 2.7: Rewrite the root biome.json to extend `@fellwork/biome-config/base`

**Files:**
- Modify: `c:/git/fellwork-worktrees/shared-configs-v0/biome.json`

- [ ] **Step 1: Replace root biome.json**

Write this exact content (replaces the hand-written version from Task 0.4):

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.13/schema.json",
  "extends": ["@fellwork/biome-config/base"],
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "includes": [
      "**",
      "!bun.lock",
      "!node_modules",
      "!**/node_modules",
      "!**/dist",
      "!**/.tsbuildinfo",
      "!**/CHANGELOG.md",
      "!packages/biome-config/tests/fixtures"
    ]
  }
}
```

> **Note:** The `!packages/biome-config/tests/fixtures` exclude is required because each fixture has its own `biome.json` declaring `"root": true`, which biome 2.x rejects when a parent biome.json already exists. The fixtures must remain isolated from the root config.

- [ ] **Step 2: Verify dogfood works**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun install
bunx biome check .
```
Expected: passes. If biome can't resolve `@fellwork/biome-config/base`, ensure `bun install` re-linked workspaces (run twice if needed).

- [ ] **Step 3: Apply biome auto-fixes triggered by adopting the base preset**

The `base` preset has stricter rules than the hand-written biome.json from Task 0.4. Adopting it forces several fixups across already-committed files:

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check --write .
bunx biome check . # verify clean after fixes
```

Expected fixups:
- `packages/biome-config/package.json`: inline `files` array expanded to multiline.
- `packages/biome-config/tests/run-fixtures.ts`: arrow params get explicit parens (`name =>` → `(name) =>`).
- Some files may need manual `// biome-ignore lint/suspicious/noConsole: CLI script` suppressions at every `console.log/error` call site — the `base` preset has `noConsole: "warn"` (or stricter). CLI scripts that genuinely use console (`packages/tsconfig/scripts/validate.ts` and `packages/biome-config/tests/run-fixtures.ts`) need these suppressions added by hand. Do NOT delete the console calls — they are intentional CLI output.
- `useOptionalChain: "error"` may flag `if (x && x.foo())` patterns. Apply with `bunx biome check --write --unsafe .` carefully and verify behavior is preserved (the `&&` → `?.` rewrite is equivalent for `string | null | undefined` types but NOT for `0 | null | undefined`).

Stage and commit any fixups together with the biome.json rewrite under Task 2.8's commit. Do NOT make a separate "biome auto-fix" commit — the fixups are caused by the dogfooding switch and belong to it.

### Task 2.8: Add the changeset and commit Phase 2

- [ ] **Step 1: Add the changeset**

Write this exact content to `c:/git/fellwork-worktrees/shared-configs-v0/.changeset/fold-in-biome-config.md`:

```markdown
---
'@fellwork/biome-config': minor
---

Folded into `fellwork/shared-configs` monorepo. Repo URL changed from `fellwork/lint` to `fellwork/shared-configs`. Package contents and exports unchanged.
```

- [ ] **Step 2: Verify changesets**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx changeset status
```
Expected: prints both `@fellwork/tsconfig` and `@fellwork/biome-config` queued for minor bumps.

- [ ] **Step 3: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add packages/biome-config .changeset/fold-in-biome-config.md biome.json bun.lock
git commit -m "feat(biome-config): fold @fellwork/biome-config into shared-configs and dogfood at root"
```

---

## Phase 3 — Build the seven new JS packages

Each new package follows the same shape: `package.json`, presets/configs, `moon.yml`, `README.md`, `CHANGELOG.md`, `LICENSE` (symlink or copy from root), changeset, and a fixture-based test where applicable. All start at version `0.1.0`.

The seven packages: `oxlint-config`, `commitlint-config`, `release-config`, `renovate-config`, `markdownlint-config`, `cspell-config`, `lefthook-config`.

> **Pattern:** Tasks 3.1–3.7 each build one package end-to-end with the same five-step structure (skeleton → content → manifest → test → commit). They are independent and can be reordered.

### Task 3.1: Build `@fellwork/oxlint-config`

**Files:**
- Create: `packages/oxlint-config/{presets,package.json,moon.yml,README.md,CHANGELOG.md,LICENSE}`

- [ ] **Step 1: Create directory and presets**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/packages/oxlint-config/presets
```

Write this exact content to `packages/oxlint-config/presets/base.json` (oxlint's `extends` field accepts a path to another oxlint config; we ship JSON files):

```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "categories": {
    "correctness": "error",
    "perf": "warn",
    "suspicious": "warn",
    "pedantic": "off",
    "style": "off"
  },
  "rules": {
    "no-console": "warn",
    "no-debugger": "error"
  },
  "ignorePatterns": ["node_modules", "dist", "**/*.d.ts"]
}
```

Write this exact content to `packages/oxlint-config/presets/node.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "extends": ["./base.json"],
  "env": { "node": true },
  "rules": {
    "no-process-exit": "warn"
  }
}
```

Write this exact content to `packages/oxlint-config/presets/browser.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "extends": ["./base.json"],
  "env": { "browser": true }
}
```

Write this exact content to `packages/oxlint-config/presets/lib.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "extends": ["./base.json"],
  "categories": {
    "correctness": "error",
    "perf": "error",
    "suspicious": "error"
  }
}
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "@fellwork/oxlint-config",
  "version": "0.1.0",
  "description": "Shared oxlint configurations for Fellwork projects.",
  "keywords": ["oxlint", "oxc", "shared-config", "fellwork", "lint"],
  "homepage": "https://github.com/fellwork/shared-configs/tree/main/packages/oxlint-config#readme",
  "bugs": { "url": "https://github.com/fellwork/shared-configs/issues" },
  "license": "MIT",
  "author": "Fellwork <shane@fellwork.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fellwork/shared-configs.git",
    "directory": "packages/oxlint-config"
  },
  "publishConfig": { "access": "public", "provenance": true },
  "files": ["presets", "README.md", "LICENSE"],
  "exports": {
    "./base": "./presets/base.json",
    "./node": "./presets/node.json",
    "./browser": "./presets/browser.json",
    "./lib": "./presets/lib.json"
  },
  "peerDependencies": {
    "oxlint": ">=0.15.0"
  }
}
```

- [ ] **Step 3: Write `moon.yml`**

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'library'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check presets'
    inputs:
      - 'presets/**/*.json'

  test:
    command: 'bunx oxlint --config presets/base.json -- presets'
    inputs:
      - 'presets/**/*.json'

  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:test'
```

- [ ] **Step 4: Write `README.md`**

```markdown
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
```

- [ ] **Step 5: Write `CHANGELOG.md`**

```markdown
# @fellwork/oxlint-config

## 0.1.0

- Initial release. Four presets: `base`, `node`, `browser`, `lib`. Built on oxlint's category system.
```

- [ ] **Step 6: Add LICENSE**

```bash
cp c:/git/fellwork-worktrees/shared-configs-v0/LICENSE c:/git/fellwork-worktrees/shared-configs-v0/packages/oxlint-config/LICENSE
```

- [ ] **Step 7: Verify**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun install
bunx biome check packages/oxlint-config
cd packages/oxlint-config
bunx oxlint --config presets/base.json -- presets
```
Expected: biome check passes; oxlint command runs without configuration errors (it may produce no output if the JSON files have no issues).

- [ ] **Step 8: Add changeset and commit**

Write `.changeset/add-oxlint-config.md`:

```markdown
---
'@fellwork/oxlint-config': patch
---

Initial release. Four presets: base, node, browser, lib.
```

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add packages/oxlint-config .changeset/add-oxlint-config.md bun.lock
git commit -m "feat(oxlint-config): add @fellwork/oxlint-config v0.1.0"
```

### Task 3.2: Build `@fellwork/commitlint-config`

**Files:**
- Create: `packages/commitlint-config/{index.js,package.json,moon.yml,README.md,CHANGELOG.md,LICENSE}`

- [ ] **Step 1: Create directory**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/packages/commitlint-config
```

- [ ] **Step 2: Write `index.js`** (commitlint configs are JS modules)

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'add',
        'breaking',
        'build',
        'chore',
        'chore-deps',
        'chore-release',
        'ci',
        'config',
        'docs',
        'feat',
        'fix',
        'i18n',
        'perf',
        'refactor',
        'release',
        'remove',
        'revert',
        'security',
        'style',
        'test',
      ],
    ],
  },
}
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "@fellwork/commitlint-config",
  "version": "0.1.0",
  "description": "Shared commitlint configuration for Fellwork projects (Conventional Commits + Fellwork's type list).",
  "keywords": ["commitlint", "conventional-commits", "shared-config", "fellwork"],
  "homepage": "https://github.com/fellwork/shared-configs/tree/main/packages/commitlint-config#readme",
  "bugs": { "url": "https://github.com/fellwork/shared-configs/issues" },
  "license": "MIT",
  "author": "Fellwork <shane@fellwork.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fellwork/shared-configs.git",
    "directory": "packages/commitlint-config"
  },
  "publishConfig": { "access": "public", "provenance": true },
  "type": "module",
  "main": "./index.js",
  "files": ["index.js", "README.md", "LICENSE"],
  "exports": {
    ".": "./index.js"
  },
  "peerDependencies": {
    "@commitlint/cli": ">=18.0.0",
    "@commitlint/config-conventional": ">=18.0.0"
  }
}
```

- [ ] **Step 4: Write `moon.yml`**

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'library'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check .'
    inputs:
      - '*.js'
      - '*.json'

  test:
    command: 'bun -e "import(\"./index.js\").then(m => { if (!m.default.rules) process.exit(1); })"'
    inputs:
      - 'index.js'

  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:test'
```

- [ ] **Step 5: Write `README.md`**

```markdown
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
```

- [ ] **Step 6: Write `CHANGELOG.md` and copy LICENSE**

```markdown
# @fellwork/commitlint-config

## 0.1.0

- Initial release. Conventional Commits with Fellwork's 20-type allowlist.
```

```bash
cp c:/git/fellwork-worktrees/shared-configs-v0/LICENSE c:/git/fellwork-worktrees/shared-configs-v0/packages/commitlint-config/LICENSE
```

- [ ] **Step 7: Verify**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun install
bunx biome check packages/commitlint-config
node --input-type=module -e "import('./packages/commitlint-config/index.js').then(m => { console.log(m.default.rules['type-enum'][2].length, 'types'); })"
```
Expected: biome passes; the node command prints `20 types`.

- [ ] **Step 8: Add changeset and commit**

```markdown
---
'@fellwork/commitlint-config': patch
---

Initial release. Conventional Commits with Fellwork's 20-type allowlist.
```

Save to `.changeset/add-commitlint-config.md`. Then:

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add packages/commitlint-config .changeset/add-commitlint-config.md
git commit -m "feat(commitlint-config): add @fellwork/commitlint-config v0.1.0"
```

### Task 3.3: Build `@fellwork/release-config`

**Purpose:** Reusable bumpp configuration. bumpp reads a `bumpp.config.ts` from the consumer; this package exports a default config the consumer re-exports.

**Files:**
- Create: `packages/release-config/{src/bumpp.ts,src/changesets.ts,src/index.ts,package.json,moon.yml,tsconfig.json,README.md,CHANGELOG.md,LICENSE}`

- [ ] **Step 1: Create directory**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/packages/release-config/src
```

- [ ] **Step 2: Write `src/bumpp.ts`**

```typescript
import type { VersionBumpOptions } from 'bumpp'

export const bumppDefaults: Partial<VersionBumpOptions> = {
  commit: 'chore-release: v%s',
  tag: 'v%s',
  push: false,
  files: ['package.json', 'packages/*/package.json'],
}
```

- [ ] **Step 3: Write `src/changesets.ts`**

```typescript
export const changesetsDefaults = {
  commit: false,
  fixed: [],
  linked: [],
  access: 'public' as const,
  baseBranch: 'main',
  updateInternalDependencies: 'patch' as const,
  ignore: [],
}
```

- [ ] **Step 4: Write `src/index.ts`**

```typescript
export { bumppDefaults } from './bumpp.js'
export { changesetsDefaults } from './changesets.js'
```

> **Note:** Use `.js` extensions in imports, NOT `.ts`. With `module: NodeNext` and emit enabled (which library mode requires), TypeScript rejects `.ts` extensions in imports — `.ts` is only legal under `allowImportingTsExtensions: true`, and that flag requires `noEmit: true`. Since this package emits `dist/`, the imports must use `.js` (NodeNext maps these back to the `.ts` source at compile time, then to the emitted `.js` at runtime).

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": ["@fellwork/tsconfig/node", "@fellwork/tsconfig/library"],
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 6: Write `package.json`**

```json
{
  "name": "@fellwork/release-config",
  "version": "0.1.0",
  "description": "Shared bumpp + changesets defaults for Fellwork projects.",
  "keywords": ["bumpp", "changesets", "release", "shared-config", "fellwork"],
  "homepage": "https://github.com/fellwork/shared-configs/tree/main/packages/release-config#readme",
  "bugs": { "url": "https://github.com/fellwork/shared-configs/issues" },
  "license": "MIT",
  "author": "Fellwork <shane@fellwork.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fellwork/shared-configs.git",
    "directory": "packages/release-config"
  },
  "publishConfig": { "access": "public", "provenance": true },
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md", "LICENSE"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./bumpp": {
      "types": "./dist/bumpp.d.ts",
      "default": "./dist/bumpp.js"
    },
    "./changesets": {
      "types": "./dist/changesets.d.ts",
      "default": "./dist/changesets.js"
    }
  },
  "peerDependencies": {
    "bumpp": ">=11.0.0"
  },
  "devDependencies": {
    "@fellwork/tsconfig": "workspace:*",
    "bumpp": "^11.0.1",
    "typescript": "^5.6.2"
  },
  "scripts": {
    "build": "tsc -b"
  }
}
```

- [ ] **Step 7: Write `moon.yml`**

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'library'
language: 'typescript'

tasks:
  build:
    command: 'bunx tsc -b'
    inputs:
      - 'src/**/*.ts'
      - 'tsconfig.json'
    outputs:
      - 'dist'

  check:
    command: 'bunx biome check src'
    inputs:
      - 'src/**/*.ts'

  test:
    command: 'bunx tsc -b --dry'
    inputs:
      - 'src/**/*.ts'
      - 'tsconfig.json'
    deps:
      - '~:build'

  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:test'
```

- [ ] **Step 8: Write `README.md`, `CHANGELOG.md`, copy LICENSE**

`README.md`:
```markdown
# @fellwork/release-config

Shared bumpp + changesets defaults for Fellwork projects.

## Install

```bash
bun add -D -E @fellwork/release-config
```

## Use with bumpp

```typescript
// bumpp.config.ts
import { bumppDefaults } from '@fellwork/release-config/bumpp'

export default {
  ...bumppDefaults,
  // overrides…
}
```

## Use with changesets

```javascript
// .changeset/config.json
{ "extends": "@fellwork/release-config/changesets" }
```

## License

MIT
```

`CHANGELOG.md`:
```markdown
# @fellwork/release-config

## 0.1.0

- Initial release. Exports `bumppDefaults` and `changesetsDefaults`.
```

```bash
cp c:/git/fellwork-worktrees/shared-configs-v0/LICENSE c:/git/fellwork-worktrees/shared-configs-v0/packages/release-config/LICENSE
```

- [ ] **Step 9: Build and verify**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun install
cd packages/release-config
bunx tsc -b
ls dist
```
Expected: `dist/` contains `index.js`, `index.d.ts`, `bumpp.js`, `bumpp.d.ts`, `changesets.js`, `changesets.d.ts`, plus `.js.map` / `.d.ts.map` siblings.

- [ ] **Step 10: Add changeset and commit**

`.changeset/add-release-config.md`:
```markdown
---
'@fellwork/release-config': patch
---

Initial release. Exports bumppDefaults and changesetsDefaults.
```

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add packages/release-config .changeset/add-release-config.md bun.lock
git commit -m "feat(release-config): add @fellwork/release-config v0.1.0"
```

### Task 3.4: Build `@fellwork/renovate-config`

**Files:**
- Create: `packages/renovate-config/{default.json,package.json,moon.yml,README.md,CHANGELOG.md,LICENSE}`

- [ ] **Step 1: Create directory and write `default.json`**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/packages/renovate-config
```

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":semanticCommits",
    ":semanticCommitTypeAll(chore-deps)",
    ":dependencyDashboard",
    ":maintainLockFilesWeekly",
    ":timezone(America/Chicago)",
    ":automergeDevDependencies",
    "schedule:weekends"
  ],
  "labels": ["dependencies"],
  "rangeStrategy": "bump",
  "lockFileMaintenance": {
    "enabled": true,
    "automerge": true
  },
  "packageRules": [
    {
      "matchManagers": ["github-actions"],
      "groupName": "github actions",
      "automerge": true
    },
    {
      "matchUpdateTypes": ["minor", "patch"],
      "matchCurrentVersion": "!/^0\\./",
      "automerge": true
    }
  ],
  "vulnerabilityAlerts": {
    "labels": ["security"],
    "assignees": ["@srmcguirt"]
  }
}
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "@fellwork/renovate-config",
  "version": "0.1.0",
  "description": "Shared Renovate preset for Fellwork projects.",
  "keywords": ["renovate", "renovate-config", "shared-config", "fellwork"],
  "homepage": "https://github.com/fellwork/shared-configs/tree/main/packages/renovate-config#readme",
  "bugs": { "url": "https://github.com/fellwork/shared-configs/issues" },
  "license": "MIT",
  "author": "Fellwork <shane@fellwork.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fellwork/shared-configs.git",
    "directory": "packages/renovate-config"
  },
  "publishConfig": { "access": "public", "provenance": true },
  "main": "default.json",
  "files": ["default.json", "README.md", "LICENSE"]
}
```

- [ ] **Step 3: Write `moon.yml`**

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'library'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check .'
    inputs:
      - '*.json'

  test:
    command: 'bunx biome check default.json'
    inputs:
      - 'default.json'

  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:test'
```

- [ ] **Step 4: Write `README.md`, `CHANGELOG.md`, copy LICENSE**

`README.md`:
```markdown
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
- Auto-merge minor/patch for ≥1.0 deps and dev deps
- Weekend schedule
- Groups GitHub Actions updates
- Tags vulnerability PRs with `security` label

## License

MIT
```

`CHANGELOG.md`:
```markdown
# @fellwork/renovate-config

## 0.1.0

- Initial release. Recommended Renovate preset with auto-merge for dev deps and minor/patch.
```

```bash
cp c:/git/fellwork-worktrees/shared-configs-v0/LICENSE c:/git/fellwork-worktrees/shared-configs-v0/packages/renovate-config/LICENSE
```

- [ ] **Step 5: Verify and commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check packages/renovate-config
```

`.changeset/add-renovate-config.md`:
```markdown
---
'@fellwork/renovate-config': patch
---

Initial release. Recommended Renovate preset with auto-merge for dev deps and minor/patch.
```

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add packages/renovate-config .changeset/add-renovate-config.md
git commit -m "feat(renovate-config): add @fellwork/renovate-config v0.1.0"
```

### Task 3.5: Build `@fellwork/markdownlint-config`

**Files:**
- Create: `packages/markdownlint-config/{markdownlint.json,package.json,moon.yml,README.md,CHANGELOG.md,LICENSE}`

- [ ] **Step 1: Create directory and write config**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/packages/markdownlint-config
```

Write `packages/markdownlint-config/markdownlint.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/DavidAnson/markdownlint/main/schema/markdownlint-config-schema.json",
  "default": true,
  "MD003": { "style": "atx" },
  "MD004": { "style": "dash" },
  "MD007": { "indent": 2 },
  "MD013": { "line_length": 100, "code_blocks": false, "tables": false },
  "MD024": { "siblings_only": true },
  "MD025": { "front_matter_title": "" },
  "MD026": { "punctuation": ".,;:!" },
  "MD029": { "style": "ordered" },
  "MD033": false,
  "MD041": false,
  "MD046": { "style": "fenced" }
}
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "@fellwork/markdownlint-config",
  "version": "0.1.0",
  "description": "Shared markdownlint configuration for Fellwork projects.",
  "keywords": ["markdownlint", "shared-config", "fellwork", "markdown"],
  "homepage": "https://github.com/fellwork/shared-configs/tree/main/packages/markdownlint-config#readme",
  "bugs": { "url": "https://github.com/fellwork/shared-configs/issues" },
  "license": "MIT",
  "author": "Fellwork <shane@fellwork.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fellwork/shared-configs.git",
    "directory": "packages/markdownlint-config"
  },
  "publishConfig": { "access": "public", "provenance": true },
  "main": "markdownlint.json",
  "files": ["markdownlint.json", "README.md", "LICENSE"],
  "exports": {
    ".": "./markdownlint.json"
  }
}
```

- [ ] **Step 3: Write `moon.yml`, `README.md`, `CHANGELOG.md`, copy LICENSE**

`moon.yml`:
```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'library'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check .'
    inputs:
      - '*.json'

  test:
    command: 'bunx biome check markdownlint.json'
    inputs:
      - 'markdownlint.json'

  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:test'
```

`README.md`:
```markdown
# @fellwork/markdownlint-config

Shared [markdownlint](https://github.com/DavidAnson/markdownlint) configuration for Fellwork projects.

## Use

```jsonc
// .markdownlint.json
{ "extends": "@fellwork/markdownlint-config" }
```

## License

MIT
```

`CHANGELOG.md`:
```markdown
# @fellwork/markdownlint-config

## 0.1.0

- Initial release.
```

```bash
cp c:/git/fellwork-worktrees/shared-configs-v0/LICENSE c:/git/fellwork-worktrees/shared-configs-v0/packages/markdownlint-config/LICENSE
```

- [ ] **Step 4: Verify and commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check packages/markdownlint-config
```

`.changeset/add-markdownlint-config.md`:
```markdown
---
'@fellwork/markdownlint-config': patch
---

Initial release.
```

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add packages/markdownlint-config .changeset/add-markdownlint-config.md
git commit -m "feat(markdownlint-config): add @fellwork/markdownlint-config v0.1.0"
```

### Task 3.6: Build `@fellwork/cspell-config`

**Files:**
- Create: `packages/cspell-config/{cspell.json,fellwork.txt,package.json,moon.yml,README.md,CHANGELOG.md,LICENSE}`

- [ ] **Step 1: Create directory**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/packages/cspell-config
```

- [ ] **Step 2: Write `fellwork.txt` (project-specific dictionary)**

```
fellwork
foreman
scribe
biome
biomejs
oxc
oxlint
moonrepo
proto
bumpp
changesets
nuxt
supabase
postgrest
clippy
crates
crate
rustfmt
fellworks
postgres
postgres
flyctl
moka
graphql
grafast
commitlint
markdownlint
cspell
lefthook
npmjs
hyperdrive
cloudflare
postgres
postgrest
sblgnt
macula
strongs
halot
hebrew
greek
```

- [ ] **Step 3: Write `cspell.json`**

```json
{
  "$schema": "https://raw.githubusercontent.com/streetsidesoftware/cspell/main/cspell.schema.json",
  "version": "0.2",
  "language": "en",
  "dictionaryDefinitions": [
    {
      "name": "fellwork",
      "path": "./fellwork.txt",
      "addWords": true
    }
  ],
  "dictionaries": ["fellwork"],
  "ignorePaths": [
    "node_modules/**",
    "dist/**",
    "*.lock",
    "bun.lock",
    "*.tsbuildinfo",
    "CHANGELOG.md"
  ]
}
```

- [ ] **Step 4: Write `package.json`**

```json
{
  "name": "@fellwork/cspell-config",
  "version": "0.1.0",
  "description": "Shared cspell configuration and project dictionary for Fellwork.",
  "keywords": ["cspell", "spelling", "shared-config", "fellwork"],
  "homepage": "https://github.com/fellwork/shared-configs/tree/main/packages/cspell-config#readme",
  "bugs": { "url": "https://github.com/fellwork/shared-configs/issues" },
  "license": "MIT",
  "author": "Fellwork <shane@fellwork.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fellwork/shared-configs.git",
    "directory": "packages/cspell-config"
  },
  "publishConfig": { "access": "public", "provenance": true },
  "main": "cspell.json",
  "files": ["cspell.json", "fellwork.txt", "README.md", "LICENSE"],
  "exports": {
    ".": "./cspell.json",
    "./dictionary": "./fellwork.txt"
  }
}
```

- [ ] **Step 5: Write `moon.yml`, `README.md`, `CHANGELOG.md`, LICENSE**

`moon.yml`:
```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'library'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check .'
    inputs:
      - '*.json'

  ci:
    command: 'noop'
    deps:
      - '~:check'
```

`README.md`:
```markdown
# @fellwork/cspell-config

Shared [cspell](https://cspell.org/) configuration with the Fellwork project dictionary.

## Use

```jsonc
// .cspell.json
{ "import": ["@fellwork/cspell-config"] }
```

## Dictionary

The bundled `fellwork.txt` covers project-specific terms (fellwork, foreman, scribe, biome, oxlint, moonrepo, hebrew, greek, etc.). Add new terms via PR to this package.

## License

MIT
```

`CHANGELOG.md`:
```markdown
# @fellwork/cspell-config

## 0.1.0

- Initial release. Includes Fellwork project dictionary.
```

```bash
cp c:/git/fellwork-worktrees/shared-configs-v0/LICENSE c:/git/fellwork-worktrees/shared-configs-v0/packages/cspell-config/LICENSE
```

- [ ] **Step 6: Verify and commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check packages/cspell-config
```

`.changeset/add-cspell-config.md`:
```markdown
---
'@fellwork/cspell-config': patch
---

Initial release. Includes Fellwork project dictionary.
```

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add packages/cspell-config .changeset/add-cspell-config.md
git commit -m "feat(cspell-config): add @fellwork/cspell-config v0.1.0 with Fellwork dictionary"
```

### Task 3.7: Build `@fellwork/lefthook-config`

**Files:**
- Create: `packages/lefthook-config/{lefthook.yml,package.json,moon.yml,README.md,CHANGELOG.md,LICENSE}`

- [ ] **Step 1: Create directory**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/packages/lefthook-config
```

- [ ] **Step 2: Write `lefthook.yml`**

```yaml
# Shared Fellwork lefthook hooks
# Override or extend in consumer repo via remote: section.

pre-commit:
  parallel: true
  commands:
    biome:
      glob: '*.{js,ts,tsx,json,jsonc,md,yaml,yml}'
      run: bunx biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true
    oxlint:
      glob: '*.{js,ts,tsx,jsx,mjs,cjs}'
      run: bunx oxlint {staged_files}

commit-msg:
  commands:
    commitlint:
      run: bunx commitlint --edit {1}

pre-push:
  commands:
    typecheck:
      glob: '*.{ts,tsx}'
      run: bunx tsc --noEmit
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "@fellwork/lefthook-config",
  "version": "0.1.0",
  "description": "Shared lefthook git hooks for Fellwork projects.",
  "keywords": ["lefthook", "git-hooks", "shared-config", "fellwork"],
  "homepage": "https://github.com/fellwork/shared-configs/tree/main/packages/lefthook-config#readme",
  "bugs": { "url": "https://github.com/fellwork/shared-configs/issues" },
  "license": "MIT",
  "author": "Fellwork <shane@fellwork.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fellwork/shared-configs.git",
    "directory": "packages/lefthook-config"
  },
  "publishConfig": { "access": "public", "provenance": true },
  "main": "lefthook.yml",
  "files": ["lefthook.yml", "README.md", "LICENSE"],
  "exports": {
    ".": "./lefthook.yml"
  },
  "peerDependencies": {
    "lefthook": ">=1.7.0"
  }
}
```

- [ ] **Step 4: Write `moon.yml`, `README.md`, `CHANGELOG.md`, LICENSE**

`moon.yml`:
```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'library'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check .'
    inputs:
      - '*.yml'
      - '*.json'

  ci:
    command: 'noop'
    deps:
      - '~:check'
```

`README.md`:
```markdown
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
```

`CHANGELOG.md`:
```markdown
# @fellwork/lefthook-config

## 0.1.0

- Initial release.
```

```bash
cp c:/git/fellwork-worktrees/shared-configs-v0/LICENSE c:/git/fellwork-worktrees/shared-configs-v0/packages/lefthook-config/LICENSE
```

- [ ] **Step 5: Verify and commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check packages/lefthook-config
```

`.changeset/add-lefthook-config.md`:
```markdown
---
'@fellwork/lefthook-config': patch
---

Initial release.
```

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add packages/lefthook-config .changeset/add-lefthook-config.md
git commit -m "feat(lefthook-config): add @fellwork/lefthook-config v0.1.0"
```

### Task 3.8: Phase 3 final verification

- [ ] **Step 1: Verify all 9 packages exist**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
ls packages/
```
Expected: `biome-config`, `commitlint-config`, `cspell-config`, `lefthook-config`, `markdownlint-config`, `oxlint-config`, `release-config`, `renovate-config`, `tsconfig`.

- [ ] **Step 2: Verify changeset queue**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx changeset status
```
Expected: 9 packages queued (2 minor for fold-ins, 7 patch for new packages — though they will be released as 0.1.0 since that's the version in package.json. The "patch" indicates "this is a release-worthy change").

- [ ] **Step 3: Run all checks**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check .
```
Expected: passes across all 9 packages.

---

## Phase 4 — Build the templates directory

Templates are file-copy assets consumed by foreman, not published to npm. They live under `templates/` and have predictable filenames so foreman can locate them by convention.

**Placeholder syntax convention:** templates use `{{variable_name}}` for placeholders foreman must substitute (e.g., `{{year}}`, `{{repo_name}}`, `{{copyright_holder}}`, `{{github_username}}`, `{{description}}`, `{{app_name}}`, `{{primary_region}}`, `{{internal_port}}`). Files containing placeholders use a `.tmpl` suffix to signal "this needs substitution before write." Files without `.tmpl` are copied verbatim. Foreman MUST honor this convention.

### Task 4.1: Create the templates directory structure

- [ ] **Step 1: Create directories**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
mkdir -p templates/community-health/.github/ISSUE_TEMPLATE
mkdir -p templates/gitignore
mkdir -p templates/vscode
mkdir -p templates/claude/.claude
```

### Task 4.2: Add community-health templates

**Files:**
- Create: `templates/community-health/LICENSE.tmpl`
- Create: `templates/community-health/SECURITY.md`
- Create: `templates/community-health/CODE_OF_CONDUCT.md`
- Create: `templates/community-health/CONTRIBUTING.md`
- Create: `templates/community-health/CODEOWNERS.tmpl`
- Create: `templates/community-health/.github/PULL_REQUEST_TEMPLATE.md`
- Create: `templates/community-health/.github/ISSUE_TEMPLATE/bug.md`
- Create: `templates/community-health/.github/ISSUE_TEMPLATE/feature.md`

- [ ] **Step 1: Write `LICENSE.tmpl`**

```
MIT License

Copyright (c) {{year}} {{copyright_holder}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Write `SECURITY.md`**

```markdown
# Security Policy

## Reporting a Vulnerability

If you discover a security issue, please **do not open a public issue**. Instead:

1. Email shane@fellwork.com with the details.
2. Use the subject line `[security] <repo-name>: <one-line description>`.
3. Include reproduction steps, affected versions, and any mitigation you've considered.

We aim to acknowledge within 2 business days and patch critical issues within 14 days.

## Supported Versions

Only the latest released version receives security updates.
```

- [ ] **Step 3: Write `CODE_OF_CONDUCT.md`**

```markdown
# Code of Conduct

This project follows the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Reporting

Report unacceptable behavior to shane@fellwork.com.
```

- [ ] **Step 4: Write `CONTRIBUTING.md`**

```markdown
# Contributing

Thanks for your interest in contributing.

## Workflow

1. Fork and create a feature branch off `main`.
2. Run `bun install` and ensure `moon run :ci` passes locally.
3. Add a [Conventional Commits](https://www.conventionalcommits.org/) message — see [@fellwork/commitlint-config](https://github.com/fellwork/shared-configs/tree/main/packages/commitlint-config) for the allowed types.
4. If your change affects a published package, run `bun run changeset` and pick the right bump.
5. Open a PR. CI must pass and one review approval is required.

## Local development

This repo uses [proto](https://moonrepo.dev/proto) to pin tool versions. Install proto, then `proto use` will install bun, node, and moon at the right versions.

## License

By contributing, you agree your contributions are licensed under MIT.
```

- [ ] **Step 5: Write `CODEOWNERS.tmpl`**

```
# Default owner for everything
*       @{{github_username}}
```

- [ ] **Step 6: Write `.github/PULL_REQUEST_TEMPLATE.md`**

```markdown
## Summary

<!-- 1-3 bullet points describing what changed and why. -->

## Test plan

- [ ] CI passes
- [ ] Added or updated tests
- [ ] Verified manually (describe how)

## Release impact

<!-- For changes to published packages: did you add a changeset? -->

- [ ] Changeset added (or N/A — this PR doesn't change a published package)
```

- [ ] **Step 7: Write `.github/ISSUE_TEMPLATE/bug.md`**

```markdown
---
name: Bug report
about: Something is broken or behaving unexpectedly
title: '[bug] '
labels: bug
---

## What happened

## What you expected

## Reproduction steps

## Environment

- OS:
- Bun / Node version:
- Affected version:
```

- [ ] **Step 8: Write `.github/ISSUE_TEMPLATE/feature.md`**

```markdown
---
name: Feature request
about: Suggest a change or addition
title: '[feat] '
labels: enhancement
---

## What problem does this solve?

## Proposed solution

## Alternatives considered

## Additional context
```

### Task 4.3: Add dotfile templates

**Files:**
- Create: `templates/editorconfig`
- Create: `templates/gitattributes`
- Create: `templates/gitignore/node`
- Create: `templates/gitignore/rust`
- Create: `templates/gitignore/polyglot`

- [ ] **Step 1: Write `templates/editorconfig`**

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab

[*.{rs,toml}]
indent_size = 4
```

- [ ] **Step 2: Write `templates/gitattributes`**

```
* text=auto eol=lf

*.json     text eol=lf
*.jsonc    text eol=lf
*.yaml     text eol=lf
*.yml      text eol=lf
*.md       text eol=lf
*.ts       text eol=lf
*.tsx      text eol=lf
*.js       text eol=lf
*.mjs      text eol=lf
*.cjs      text eol=lf
*.toml     text eol=lf
*.rs       text eol=lf

bun.lock         text eol=lf -diff
Cargo.lock       text eol=lf -diff
```

- [ ] **Step 3: Write `templates/gitignore/node`**

```gitignore
node_modules/
bun.lockb
dist/
.tsbuildinfo
*.tsbuildinfo
.moon/cache/
.moon/docker/
.idea/
.DS_Store
Thumbs.db
.env
.env.local
.env.*.local
*.log
npm-debug.log*
```

- [ ] **Step 4: Write `templates/gitignore/rust`**

```gitignore
target/
Cargo.lock.bak
**/*.rs.bk
*.pdb
.idea/
.DS_Store
Thumbs.db
.env
.env.local
*.log
```

> **Note:** `Cargo.lock` IS committed for binaries and apps; the spec doesn't prescribe a workspace-wide rule here. Consumers can edit if their crate is a library.

- [ ] **Step 5: Write `templates/gitignore/polyglot`**

```gitignore
# Node
node_modules/
bun.lockb
dist/
.tsbuildinfo
*.tsbuildinfo

# Rust
target/
**/*.rs.bk

# Moon
.moon/cache/
.moon/docker/

# Editors
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Env / logs
.env
.env.local
.env.*.local
*.log
```

### Task 4.4: Add VSCode templates

- [ ] **Step 1: Write `templates/vscode/settings.json`**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  },
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "[markdown]": {
    "files.trimTrailingWhitespace": false
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "rust-analyzer.cargo.features": "all"
}
```

- [ ] **Step 2: Write `templates/vscode/extensions.json`**

```json
{
  "recommendations": [
    "biomejs.biome",
    "rust-lang.rust-analyzer",
    "tamasfe.even-better-toml",
    "yoavbls.pretty-ts-errors",
    "streetsidesoftware.code-spell-checker",
    "DavidAnson.vscode-markdownlint",
    "moonrepo.moon-console",
    "Anthropic.claude-code"
  ],
  "unwantedRecommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

### Task 4.5: Add Claude templates

- [ ] **Step 1: Write `templates/claude/CLAUDE.md.tmpl`**

```markdown
# {{repo_name}}

{{description}}

## Commands

```bash
bun install                # install dependencies
moon run :ci               # full CI pipeline (check + test)
bun run changeset          # add a changeset for the current change
```

## Layout

- `packages/` (or `src/`) — source
- `tests/` (or `*.test.ts`) — tests
- `docs/` — design docs and ADRs

## Conventions

- **Commits:** Conventional Commits per `@fellwork/commitlint-config`. Allowed types: add, breaking, build, chore, chore-deps, chore-release, ci, config, docs, feat, fix, i18n, perf, refactor, release, remove, revert, security, style, test.
- **Format / lint:** biome (formatter + core lints), oxlint (broad correctness sweep). Configured via `@fellwork/biome-config` and `@fellwork/oxlint-config`.
- **TypeScript:** `@fellwork/tsconfig` presets. Pick `node`, `browser`, or compose with `library`.
- **Releases:** changesets-driven, npm trusted publishing (OIDC). No `NPM_TOKEN` secret.

## Skill routing

When the user's request matches an available skill, invoke it via `Skill` first. Common routes:

- Bugs, errors, "why is this broken" → `investigate`
- Ship, deploy, PR → `ship`
- Code review → `review`
```

- [ ] **Step 2: Write `templates/claude/.claude/settings.json`**

```json
{
  "hooks": {}
}
```

> **Note:** Empty `hooks` block. Consumers add per-repo hooks. The file's presence makes `.claude/` a discoverable directory.

### Task 4.6: Add remaining single-file templates

- [ ] **Step 1: Write `templates/bunfig.toml`**

```toml
[install]
exact = false
peer = true
production = false
```

- [ ] **Step 2: Write `templates/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'weekly'
    labels: ['dependencies', 'github-actions']
```

> **Note:** Dependabot is configured *only* for GitHub Actions, since Renovate handles npm and Cargo. This is the security-only fallback per the spec.

- [ ] **Step 3: Write `templates/fly.toml.tmpl`**

```toml
app = '{{app_name}}'
primary_region = '{{primary_region}}'

[build]
  dockerfile = 'Dockerfile'

[http_service]
  internal_port = {{internal_port}}
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = 'shared-cpu-1x'
  memory = '512mb'

[env]
  PORT = '{{internal_port}}'
```

- [ ] **Step 4: Write `templates/README.md.tmpl`**

```markdown
# {{repo_name}}

{{description}}

## Install

```bash
bun install
```

## Development

```bash
moon run :ci         # check + test
bun run check        # biome
bun run lint         # biome + oxlint
```

## License

MIT — see [LICENSE](./LICENSE).
```

### Task 4.7: Verify and commit Phase 4

- [ ] **Step 1: Run biome on the templates that are valid JSON/YAML/MD**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check templates
```
Expected: passes (templates are syntactically valid; placeholder tokens like `{{year}}` are inside strings/comments where biome doesn't object).

- [ ] **Step 2: List the templates tree**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
find templates -type f | sort
```
Expected: ~20 files across community-health, gitignore, vscode, claude, and the single-file templates.

- [ ] **Step 3: Commit Phase 4**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add templates
git commit -m "feat(templates): add community-health, dotfiles, vscode, claude, and per-kind templates"
```

---

## Phase 5 — Rust template directory

Add `templates/rust/` with the canonical Rust dev configs. The `.fw-domain-lint.toml` migration from `fellwork-ops` is *documented* (with the new fetch-by-tag CI snippet), but the actual update of `fellwork/api`'s CI to point at the new home is deferred to the adoption plan.

### Task 5.1: Create `templates/rust/` and add the configs

**Files:**
- Create: `templates/rust/.cargo/config.toml`
- Create: `templates/rust/clippy.toml`
- Create: `templates/rust/rustfmt.toml`
- Create: `templates/rust/deny.toml`
- Create: `templates/rust/rust-toolchain.toml`
- Create: `templates/rust/.fw-domain-lint.toml`
- Create: `templates/rust/README.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/templates/rust/.cargo
```

- [ ] **Step 2: Write `templates/rust/.cargo/config.toml`**

```toml
[build]
incremental = true

[target.'cfg(all())']
rustflags = [
  "-D", "warnings",
]

[net]
git-fetch-with-cli = true

[registries.crates-io]
protocol = "sparse"
```

- [ ] **Step 3: Write `templates/rust/clippy.toml`**

```toml
# Fellwork shared clippy configuration.
# See https://rust-lang.github.io/rust-clippy/master/index.html

avoid-breaking-exported-api = false
msrv = "1.74"
```

- [ ] **Step 4: Write `templates/rust/rustfmt.toml`**

```toml
edition = "2021"
max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
use_field_init_shorthand = true
use_try_shorthand = true
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true
reorder_modules = true
```

- [ ] **Step 5: Write `templates/rust/deny.toml`**

```toml
[advisories]
db-path = "~/.cargo/advisory-db"
db-urls = ["https://github.com/rustsec/advisory-db"]
yanked = "deny"
ignore = []

[licenses]
unlicensed = "deny"
allow = [
  "MIT",
  "Apache-2.0",
  "Apache-2.0 WITH LLVM-exception",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "Unicode-DFS-2016",
  "CC0-1.0",
  "Zlib",
]
copyleft = "warn"
allow-osi-fsf-free = "neither"
default = "deny"
confidence-threshold = 0.93

[bans]
multiple-versions = "warn"
wildcards = "deny"

[sources]
unknown-registry = "deny"
unknown-git = "deny"
allow-registry = ["https://github.com/rust-lang/crates.io-index"]
```

- [ ] **Step 6: Write `templates/rust/rust-toolchain.toml`**

```toml
[toolchain]
channel = "1.83.0"
components = ["rustfmt", "clippy", "rust-src"]
profile = "default"
```

- [ ] **Step 7: Write `templates/rust/.fw-domain-lint.toml`**

This file is the canonical Fellwork domain-lint config. Copy the existing one from `fellwork-ops` so we have a faithful starting point.

```bash
# Find the existing copy in fellwork-ops
ls c:/git/fellwork/ops/wiki/ 2>/dev/null
ls c:/git/fellwork/ops/ 2>/dev/null | head -20
find c:/git/fellwork/ops -name '.fw-domain-lint.toml' 2>/dev/null
```

If the existing copy is found, copy it:

```bash
cp <found-path> c:/git/fellwork-worktrees/shared-configs-v0/templates/rust/.fw-domain-lint.toml
```

If not found (the spec says it lives in fellwork-ops but path may have changed), write a stub to be filled in during adoption:

```toml
# Fellwork domain lint configuration.
# Migrated from fellwork-ops on 2026-04-26.
# Consumed by `fw-domain-lint` (in c:/git/fellwork/api/crates/fw-domain-lint/).
#
# This file is the canonical source. fellwork/api fetches it from this repo
# at a pinned tag during CI; see this directory's README.md for details.

# Rules: keep in sync with the enforcer in fellwork/api/crates/fw-domain-lint/.
# At time of migration, five rules were enforced:
#   1. Rust: apps/api must not write CORPUS tables
#   2. Rust: reading_plans writers path-allowlisted
#   3. Rust visibility: fw-store::delete_predicate module-private
#   4. Rust: phrased_blocks writers restricted to fw-phrase/fw-pipeline/fw-store
#   5. TS: enforced in fellwork-web - apps/web/layers/*/server/api must not write CORPUS

# TODO: paste the actual rule definitions during the api adoption phase.
# For now this stub establishes the file's new home.
```

> **Note for executor:** the executor MUST run the `find` command first. If the real config is found, use it. The stub is only a fallback.

- [ ] **Step 8: Write `templates/rust/README.md`**

```markdown
# Rust template configs

These files are copied into Rust workspaces by foreman during scaffold or `foreman adopt --kind=rust-workspace`.

## Files

| File | Purpose |
|---|---|
| `.cargo/config.toml` | Cargo build flags (denies warnings, sparse registry) |
| `clippy.toml` | Clippy MSRV + tuning |
| `rustfmt.toml` | rustfmt rules |
| `deny.toml` | cargo-deny license + advisory + source policy |
| `rust-toolchain.toml` | Pins rustc channel + required components |
| `.fw-domain-lint.toml` | Fellwork-specific domain lint rules (consumed by `fw-domain-lint` crate in fellwork/api) |

## `.fw-domain-lint.toml` distribution

Unlike the other Rust files which are copied once at scaffold time, this file is *also* fetched by fellwork/api's CI at lint time, pinned to a tag. This lets domain-lint rules propagate to api without re-scaffolding.

Consumer-side CI snippet (in `fellwork/api/.github/workflows/ci.yml`):

```yaml
- name: fetch shared domain-lint config
  run: |
    curl -sSL \
      https://raw.githubusercontent.com/fellwork/shared-configs/${DOMAIN_LINT_TAG}/templates/rust/.fw-domain-lint.toml \
      -o .fw-domain-lint.toml
  env:
    DOMAIN_LINT_TAG: 'domain-lint-v3'
```

The `domain-lint-v3` tag is bumped from this repo when rules change. Renovate's `github-actions` manager bumps the tag in consumer workflows automatically.

## Updates

For everything else (`clippy.toml`, `rustfmt.toml`, etc.), updates are pulled by `foreman sync`. See foreman's docs for the diff/merge model.
```

- [ ] **Step 9: Verify and commit Phase 5**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check templates/rust 2>&1 || echo "biome may complain about TOML — that's expected, biome doesn't lint TOML"
ls templates/rust/
```
Expected: 6 toml files + `.cargo/config.toml` + `README.md`.

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add templates/rust
git commit -m "feat(templates): add Rust template configs and document .fw-domain-lint.toml fetch model"
```

---

## Phase 6 — Reusable workflows + composite actions

GitHub-blessed sharing pattern: workflows live at `.github/workflows/` and consumers reference them by `uses:` ref pinned to a major tag (`@v1`).

### Task 6.1: Create the workflows directory

- [ ] **Step 1: Create directory**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/.github/workflows
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/.github/actions/setup-bun-biome
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/.github/actions/setup-rust-toolchain
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/.github/actions/extract-semver-label
```

### Task 6.2: Write composite actions

- [ ] **Step 1: Write `setup-bun-biome/action.yml`**

```yaml
name: 'Setup Bun + Biome'
description: 'Install bun and cache biome'
inputs:
  bun-version:
    description: 'Bun version to install'
    required: false
    default: '1.1.42'
runs:
  using: 'composite'
  steps:
    - name: Setup bun
      uses: oven-sh/setup-bun@v2
      with:
        bun-version: ${{ inputs.bun-version }}

    - name: Cache bun deps
      uses: actions/cache@v4
      with:
        path: ~/.bun/install/cache
        key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}
        restore-keys: |
          ${{ runner.os }}-bun-

    - name: Install
      shell: bash
      run: bun install --frozen-lockfile
```

- [ ] **Step 2: Write `setup-rust-toolchain/action.yml`**

```yaml
name: 'Setup Rust Toolchain'
description: 'Install Rust via rust-toolchain.toml and cache the build'
inputs:
  components:
    description: 'Comma-separated list of components (overrides rust-toolchain.toml)'
    required: false
    default: ''
runs:
  using: 'composite'
  steps:
    - name: Install rustup
      shell: bash
      run: |
        if ! command -v rustup &>/dev/null; then
          curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain none
          echo "$HOME/.cargo/bin" >> $GITHUB_PATH
        fi

    - name: Install toolchain from rust-toolchain.toml
      shell: bash
      run: rustup show

    - name: Install extra components
      if: ${{ inputs.components != '' }}
      shell: bash
      run: rustup component add ${{ inputs.components }}

    - name: Cache cargo
      uses: actions/cache@v4
      with:
        path: |
          ~/.cargo/bin/
          ~/.cargo/registry/index/
          ~/.cargo/registry/cache/
          ~/.cargo/git/db/
          target/
        key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
        restore-keys: |
          ${{ runner.os }}-cargo-
```

- [ ] **Step 3: Write `extract-semver-label/action.yml`**

```yaml
name: 'Extract semver label'
description: 'Read semver:* labels off the merged PR and emit them as outputs'
outputs:
  bump:
    description: 'Bump kind: major | minor | patch | canary | none'
    value: ${{ steps.extract.outputs.bump }}
runs:
  using: 'composite'
  steps:
    - name: Extract from PR labels
      id: extract
      shell: bash
      env:
        GH_TOKEN: ${{ github.token }}
      run: |
        labels=$(gh pr view ${{ github.event.pull_request.number || github.event.number }} --json labels --jq '.labels[].name' || echo "")
        bump="none"
        for label in $labels; do
          case "$label" in
            semver:major) bump="major" ;;
            semver:minor) bump="minor" ;;
            semver:patch) bump="patch" ;;
            semver:canary) bump="canary" ;;
          esac
        done
        echo "bump=$bump" >> $GITHUB_OUTPUT
```

### Task 6.3: Write reusable workflows

- [ ] **Step 1: Write `ts-ci.yml`**

```yaml
name: TS CI

on:
  workflow_call:
    inputs:
      node-version:
        description: 'Node version'
        required: false
        type: string
        default: '22'
      bun-version:
        description: 'Bun version'
        required: false
        type: string
        default: '1.1.42'

jobs:
  verify:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: fellwork/shared-configs/.github/actions/setup-bun-biome@v1
        with:
          bun-version: ${{ inputs.bun-version }}

      - name: Biome check
        run: bunx biome check .

      - name: Oxlint
        run: bunx oxlint || true

      - name: TypeScript
        run: bunx tsc --noEmit

      - name: Tests
        run: bun test
```

- [ ] **Step 2: Write `rust-ci.yml`**

```yaml
name: Rust CI

on:
  workflow_call:
    inputs:
      domain-lint-tag:
        description: 'shared-configs tag for .fw-domain-lint.toml fetch'
        required: false
        type: string
        default: 'domain-lint-v1'

jobs:
  verify:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: fellwork/shared-configs/.github/actions/setup-rust-toolchain@v1

      - name: Fetch shared domain-lint config
        run: |
          curl -sSL \
            https://raw.githubusercontent.com/fellwork/shared-configs/${{ inputs.domain-lint-tag }}/templates/rust/.fw-domain-lint.toml \
            -o .fw-domain-lint.toml

      - name: Format check
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --workspace --all-targets -- -D warnings

      - name: Test
        run: cargo test --workspace
```

- [ ] **Step 3: Write `npm-release.yml`** (OIDC-only; NO `NPM_TOKEN`)

```yaml
name: npm release

on:
  workflow_call:
    inputs:
      bun-version:
        description: 'Bun version'
        required: false
        type: string
        default: '1.1.42'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write       # for changesets to push the version PR
      pull-requests: write  # for changesets to open the version PR
      id-token: write       # for npm trusted publishing (OIDC)
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: fellwork/shared-configs/.github/actions/setup-bun-biome@v1
        with:
          bun-version: ${{ inputs.bun-version }}

      - name: Setup Node (for npm CLI ≥ 11.5.1)
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'

      - name: Verify npm CLI version supports OIDC
        run: |
          npm_version=$(npm --version)
          echo "npm version: $npm_version"
          required="11.5.1"
          if [ "$(printf '%s\n%s\n' "$required" "$npm_version" | sort -V | head -n1)" != "$required" ]; then
            echo "::error::npm $npm_version does not support OIDC publishing. Need ≥ $required."
            exit 1
          fi

      - name: Build packages that need building
        # Only @fellwork/release-config has a build step; others ship JSON directly.
        # If more buildable packages are added, list them here.
        run: bun run --filter '@fellwork/release-config' build

      - name: Create release PR or publish via OIDC
        uses: changesets/action@v1
        with:
          publish: bunx changeset publish
          version: bun run version-packages
          commit: 'chore-release: version packages'
          title: 'chore-release: version packages'
        # NO NPM_TOKEN — trusted publishing handles it via id-token: write
```

- [ ] **Step 4: Write `cargo-publish.yml`**

```yaml
name: cargo publish

on:
  workflow_call:
    inputs:
      crate-path:
        description: 'Path to the crate to publish'
        required: true
        type: string
    secrets:
      CARGO_REGISTRY_TOKEN:
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: fellwork/shared-configs/.github/actions/setup-rust-toolchain@v1

      - name: cargo publish
        working-directory: ${{ inputs.crate-path }}
        env:
          CARGO_REGISTRY_TOKEN: ${{ secrets.CARGO_REGISTRY_TOKEN }}
        run: cargo publish
```

> **Note:** crates.io does not yet support OIDC trusted publishing as of 2026-04. `CARGO_REGISTRY_TOKEN` remains a secret. When crates.io ships OIDC, this workflow will be updated.

- [ ] **Step 5: Write `semver-label-check.yml`**

```yaml
name: semver label check

on:
  workflow_call: {}

jobs:
  check:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    steps:
      - uses: actions/checkout@v4

      - uses: fellwork/shared-configs/.github/actions/extract-semver-label@v1
        id: bump

      - name: Require a semver label
        if: ${{ steps.bump.outputs.bump == 'none' }}
        run: |
          echo "::error::PR must carry exactly one of: semver:major, semver:minor, semver:patch, semver:canary"
          exit 1
```

- [ ] **Step 6: Write `verify-repo-shape.yml`**

```yaml
name: Verify repo shape

on:
  workflow_call:
    inputs:
      kind:
        description: 'Repo kind (must match a kind in fellwork/shared-configs/kinds/)'
        required: true
        type: string

jobs:
  verify:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          path: consumer

      - uses: actions/checkout@v4
        with:
          repository: fellwork/shared-configs
          ref: v1
          path: shared-configs

      - uses: fellwork/shared-configs/.github/actions/setup-bun-biome@v1

      - name: Run repo-shape verifier
        working-directory: shared-configs
        run: bun run tools/verify-repo-shape.ts --kind ${{ inputs.kind }} --repo ../consumer
```

### Task 6.4: Self-host the workflows on shared-configs's own CI

**Files:**
- Create: `.github/workflows/ci.yml` (top-level workflow that calls the reusable ones)
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request: {}

jobs:
  ts:
    uses: ./.github/workflows/ts-ci.yml

  shape:
    uses: ./.github/workflows/verify-repo-shape.yml
    with:
      kind: 'ts-application'
```

- [ ] **Step 2: Write `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency:
  group: release
  cancel-in-progress: false

jobs:
  release:
    uses: ./.github/workflows/npm-release.yml
```

### Task 6.5: Document the major-tag procedure

**Files:**
- Create: `.github/TAGS.md`

- [ ] **Step 1: Write `.github/TAGS.md`**

```markdown
# Major-version tags for reusable workflows

Reusable workflows in this repo are versioned via moving major-version git tags (`v1`, `v2`, …). Consumer repos reference a tag rather than a SHA so they get backward-compatible improvements automatically.

## Bumping the v1 tag

When workflow files in `.github/workflows/` or composite actions in `.github/actions/` change *backward-compatibly*:

```bash
git tag -fa v1 -m "v1 → moved to $(git rev-parse HEAD)"
git push origin v1 --force
```

## Cutting a new major (`v2`, `v3`, …)

When a workflow has a breaking input/output change:

```bash
git tag -a v2 -m "v2 cut at $(git rev-parse HEAD)"
git push origin v2
```

Then update `README.md` and `docs/workflows.md` with the migration notes. Consumers stay on `v1` until they opt in.

## Initial tag setup

After this plan's first deploy, run once:

```bash
git tag -a v1 -m "v1 initial"
git tag -a domain-lint-v1 -m "domain-lint-v1 initial"
git push origin v1 domain-lint-v1
```

The `domain-lint-v1` tag pins `templates/rust/.fw-domain-lint.toml`. It is bumped *separately* from `v1` because domain-lint rules change on a different cadence than CI workflow shape.
```

### Task 6.6: Verify and commit Phase 6

- [ ] **Step 1: Verify YAML is valid**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check .github
```
Expected: passes. (Biome can format YAML; if it complains about field order, accept its formatting.)

- [ ] **Step 2: List workflows + actions**

```bash
ls .github/workflows .github/actions
```
Expected: 8 files in `workflows/` (6 reusable + 2 self-host = ci.yml, release.yml), 3 directories in `actions/` each containing `action.yml`.

- [ ] **Step 3: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add .github
git commit -m "ci(workflows): add reusable workflows + composite actions, self-host CI/release"
```

---

## Phase 7 — Kind manifests + repo-shape verifier

The integration layer foreman reads. One YAML file per repo kind, plus a JSON Schema validator and a `verify-repo-shape.ts` script.

### Task 7.1: Create `kinds/` directory and JSON Schema

**Files:**
- Create: `kinds/_schema.json`

- [ ] **Step 1: Create directory**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/kinds
```

- [ ] **Step 2: Write `kinds/_schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://github.com/fellwork/shared-configs/blob/main/kinds/_schema.json",
  "title": "Fellwork repo-kind manifest",
  "type": "object",
  "required": ["kind", "description"],
  "additionalProperties": false,
  "properties": {
    "kind": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "Kind identifier; must match the filename (without .yaml)."
    },
    "description": {
      "type": "string",
      "minLength": 1
    },
    "extends": {
      "type": "string",
      "description": "Parent manifest to compose from. Resolved relative to kinds/."
    },
    "packages": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "devDependencies": {
          "type": "array",
          "items": { "type": "string" }
        },
        "peerDependencies": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "version"],
            "additionalProperties": false,
            "properties": {
              "name": { "type": "string" },
              "version": { "type": "string" }
            }
          }
        }
      }
    },
    "templates": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Template paths relative to templates/. May include @<variant> suffix."
    },
    "tsconfig": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "extends": {
          "type": "array",
          "items": { "type": "string" }
        },
        "include": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "cargo": {
      "type": "object",
      "description": "Cargo.toml shape for Rust kinds",
      "additionalProperties": true
    },
    "workflows": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Reusable workflow names with @<tag> suffix"
    },
    "renovate": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "extends": { "type": "string" }
      }
    },
    "scripts": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    }
  }
}
```

### Task 7.2: Write the six kind manifests

- [ ] **Step 1: Write `kinds/ts-library.yaml`**

```yaml
kind: ts-library
description: A TypeScript library published to npm

packages:
  devDependencies:
    - '@fellwork/tsconfig'
    - '@fellwork/biome-config'
    - '@fellwork/oxlint-config'
    - '@fellwork/commitlint-config'
    - '@fellwork/release-config'
    - '@fellwork/lefthook-config'
    - '@fellwork/cspell-config'
    - '@fellwork/markdownlint-config'
    - 'changesets'
    - 'bumpp'
  peerDependencies:
    - { name: 'typescript', version: '>=5.5.0' }

templates:
  - community-health/
  - editorconfig
  - gitattributes
  - gitignore/node
  - vscode/
  - claude/
  - bunfig.toml
  - 'README.md.tmpl@ts-library'
  - dependabot.yml

tsconfig:
  extends:
    - '@fellwork/tsconfig/node'
    - '@fellwork/tsconfig/library'
  include:
    - 'src/**/*.ts'

workflows:
  - 'ts-ci.yml@v1'
  - 'npm-release.yml@v1'
  - 'semver-label-check.yml@v1'
  - 'verify-repo-shape.yml@v1'

renovate:
  extends: '@fellwork/renovate-config'

scripts:
  build: 'bun run scripts/build.ts'
  test: 'bun test'
  lint: 'biome check . && oxlint .'
```

- [ ] **Step 2: Write `kinds/ts-application.yaml`**

```yaml
kind: ts-application
description: A TypeScript application or CLI (no npm publish)

packages:
  devDependencies:
    - '@fellwork/tsconfig'
    - '@fellwork/biome-config'
    - '@fellwork/oxlint-config'
    - '@fellwork/commitlint-config'
    - '@fellwork/lefthook-config'
    - '@fellwork/cspell-config'
    - '@fellwork/markdownlint-config'
  peerDependencies:
    - { name: 'typescript', version: '>=5.5.0' }

templates:
  - community-health/
  - editorconfig
  - gitattributes
  - gitignore/node
  - vscode/
  - claude/
  - bunfig.toml
  - 'README.md.tmpl@ts-application'
  - dependabot.yml

tsconfig:
  extends:
    - '@fellwork/tsconfig/node'
  include:
    - 'src/**/*.ts'

workflows:
  - 'ts-ci.yml@v1'
  - 'verify-repo-shape.yml@v1'

renovate:
  extends: '@fellwork/renovate-config'

scripts:
  test: 'bun test'
  lint: 'biome check . && oxlint .'
```

- [ ] **Step 3: Write `kinds/nuxt-app.yaml`**

```yaml
kind: nuxt-app
description: A Nuxt frontend application

packages:
  devDependencies:
    - '@fellwork/tsconfig'
    - '@fellwork/biome-config'
    - '@fellwork/oxlint-config'
    - '@fellwork/commitlint-config'
    - '@fellwork/lefthook-config'
    - '@fellwork/cspell-config'
    - '@fellwork/markdownlint-config'
  peerDependencies:
    - { name: 'typescript', version: '>=5.5.0' }
    - { name: 'nuxt', version: '>=3.13.0' }

templates:
  - community-health/
  - editorconfig
  - gitattributes
  - gitignore/node
  - vscode/
  - claude/
  - bunfig.toml
  - 'README.md.tmpl@nuxt-app'
  - dependabot.yml

tsconfig:
  extends:
    - './.nuxt/tsconfig.json'
    - '@fellwork/tsconfig/base'

workflows:
  - 'ts-ci.yml@v1'
  - 'verify-repo-shape.yml@v1'

renovate:
  extends: '@fellwork/renovate-config'

scripts:
  dev: 'nuxt dev'
  build: 'nuxt build'
  lint: 'biome check . && oxlint .'
```

- [ ] **Step 4: Write `kinds/rust-workspace.yaml`**

```yaml
kind: rust-workspace
description: A multi-crate Cargo workspace, optionally deployed to Fly

templates:
  - community-health/
  - editorconfig
  - gitattributes
  - gitignore/rust
  - vscode/
  - claude/
  - rust/
  - 'README.md.tmpl@rust-workspace'
  - dependabot.yml
  - fly.toml.tmpl

cargo:
  workspace:
    resolver: '2'
    members:
      - 'crates/*'

workflows:
  - 'rust-ci.yml@v1'
  - 'verify-repo-shape.yml@v1'

renovate:
  extends: '@fellwork/renovate-config'
```

- [ ] **Step 5: Write `kinds/rust-library.yaml`**

```yaml
kind: rust-library
description: A single-crate Rust library published to crates.io

templates:
  - community-health/
  - editorconfig
  - gitattributes
  - gitignore/rust
  - vscode/
  - claude/
  - rust/
  - 'README.md.tmpl@rust-library'
  - dependabot.yml

cargo:
  package:
    edition: '2021'
    license: 'MIT'

workflows:
  - 'rust-ci.yml@v1'
  - 'cargo-publish.yml@v1'
  - 'semver-label-check.yml@v1'
  - 'verify-repo-shape.yml@v1'

renovate:
  extends: '@fellwork/renovate-config'
```

- [ ] **Step 6: Write `kinds/polyglot.yaml`**

```yaml
kind: polyglot
description: A repo with both TS and Rust code (e.g., Rust workspace + TS sidecar)

packages:
  devDependencies:
    - '@fellwork/tsconfig'
    - '@fellwork/biome-config'
    - '@fellwork/oxlint-config'
    - '@fellwork/commitlint-config'
    - '@fellwork/lefthook-config'
    - '@fellwork/cspell-config'
    - '@fellwork/markdownlint-config'
  peerDependencies:
    - { name: 'typescript', version: '>=5.5.0' }

templates:
  - community-health/
  - editorconfig
  - gitattributes
  - gitignore/polyglot
  - vscode/
  - claude/
  - rust/
  - bunfig.toml
  - 'README.md.tmpl@polyglot'
  - dependabot.yml

tsconfig:
  extends:
    - '@fellwork/tsconfig/node'

cargo:
  workspace:
    resolver: '2'
    members:
      - 'crates/*'

workflows:
  - 'ts-ci.yml@v1'
  - 'rust-ci.yml@v1'
  - 'verify-repo-shape.yml@v1'

renovate:
  extends: '@fellwork/renovate-config'
```

### Task 7.3: Write the repo-shape verifier

**Files:**
- Create: `tools/verify-repo-shape.ts`
- Create: `tools/fixtures/.gitkeep`

- [ ] **Step 1: Create directories**

```bash
mkdir -p c:/git/fellwork-worktrees/shared-configs-v0/tools/fixtures
touch c:/git/fellwork-worktrees/shared-configs-v0/tools/fixtures/.gitkeep
```

- [ ] **Step 2: Write `tools/verify-repo-shape.ts`**

```typescript
#!/usr/bin/env bun
/**
 * verify-repo-shape — assert that a consumer repo has the files its kind requires.
 *
 * Usage:
 *   bun run tools/verify-repo-shape.ts --kind <kind> [--repo <path>]
 *
 * - `kind` matches a kinds/<kind>.yaml manifest in this repo.
 * - `repo` defaults to the cwd; the consumer repo to verify.
 *
 * Exits 0 if the repo's shape matches the kind manifest; exits 1 listing
 * missing files otherwise. Does NOT enforce content — only presence.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import * as YAML from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SHARED_CONFIGS_ROOT = resolve(__dirname, '..')
const KINDS_DIR = join(SHARED_CONFIGS_ROOT, 'kinds')

interface KindManifest {
  kind: string
  description: string
  extends?: string
  templates?: string[]
  workflows?: string[]
  packages?: { devDependencies?: string[] }
  tsconfig?: { extends?: string[] }
  cargo?: Record<string, unknown>
}

function loadKind(kindName: string): KindManifest {
  const path = join(KINDS_DIR, `${kindName}.yaml`)
  if (!existsSync(path)) {
    throw new Error(`Kind manifest not found: ${path}`)
  }
  return YAML.parse(readFileSync(path, 'utf8')) as KindManifest
}

interface VerificationResult {
  missing: string[]
  warnings: string[]
}

function verify(kind: KindManifest, repoRoot: string): VerificationResult {
  const missing: string[] = []
  const warnings: string[] = []

  // Required hygiene files for every kind
  const required = ['LICENSE', 'README.md', '.editorconfig', '.gitattributes', '.gitignore']
  for (const f of required) {
    if (!existsSync(join(repoRoot, f))) missing.push(f)
  }

  // CLAUDE.md is required if the manifest pulls templates/claude/
  if (kind.templates?.some((t) => t.startsWith('claude'))) {
    if (!existsSync(join(repoRoot, 'CLAUDE.md'))) missing.push('CLAUDE.md')
  }

  // Each declared workflow must have a corresponding .github/workflows/*.yml
  for (const w of kind.workflows ?? []) {
    const filename = w.split('@')[0] // strip @v1 suffix
    if (!existsSync(join(repoRoot, '.github', 'workflows', filename))) {
      // Don't fail — consumer may name the workflow file differently.
      // Just warn.
      warnings.push(`expected a workflow that uses ${w} (looked for .github/workflows/${filename})`)
    }
  }

  // package.json must declare each devDependency in packages.devDependencies
  const pkgPath = join(repoRoot, 'package.json')
  if (existsSync(pkgPath) && kind.packages?.devDependencies) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      devDependencies?: Record<string, string>
    }
    for (const dep of kind.packages.devDependencies) {
      if (!pkg.devDependencies?.[dep]) {
        warnings.push(`devDependency ${dep} missing from package.json`)
      }
    }
  } else if (kind.packages?.devDependencies && !existsSync(pkgPath)) {
    missing.push('package.json')
  }

  // Cargo workspace members
  if (kind.cargo?.workspace) {
    if (!existsSync(join(repoRoot, 'Cargo.toml'))) missing.push('Cargo.toml')
  }

  return { missing, warnings }
}

function main(): void {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      kind: { type: 'string' },
      repo: { type: 'string', default: process.cwd() },
    },
  })

  if (!values.kind) {
    console.error('--kind is required')
    process.exit(2)
  }

  const kind = loadKind(values.kind)
  const repoRoot = resolve(values.repo!)
  console.log(`verifying ${repoRoot} against kind=${kind.kind}`)

  const { missing, warnings } = verify(kind, repoRoot)

  for (const w of warnings) console.warn(`  warning: ${w}`)

  if (missing.length === 0) {
    console.log(`✓ shape OK (${warnings.length} warning(s))`)
    process.exit(0)
  }

  console.error('\n✗ shape mismatch — missing files:')
  for (const m of missing) console.error(`  - ${m}`)
  process.exit(1)
}

main()
```

- [ ] **Step 3: Add `yaml` as a devDependency**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun add -d yaml@^2.6.0
```

### Task 7.4: Write a test for the verifier (TDD)

**Files:**
- Create: `tools/verify-repo-shape.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { afterAll, describe, expect, test } from 'bun:test'
import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VERIFIER = resolve(__dirname, 'verify-repo-shape.ts')

const tempDirs: string[] = []

afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true })
})

function makeTempRepo(): string {
  const d = mkdtempSync(join(tmpdir(), 'verify-repo-shape-'))
  tempDirs.push(d)
  return d
}

function runVerifier(repo: string, kind: string): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execSync(`bun run "${VERIFIER}" --kind ${kind} --repo "${repo}"`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    })
    return { code: 0, stdout, stderr: '' }
  } catch (e) {
    const err = e as { status: number; stdout: string; stderr: string }
    return { code: err.status, stdout: err.stdout?.toString() ?? '', stderr: err.stderr?.toString() ?? '' }
  }
}

describe('verify-repo-shape', () => {
  test('empty repo fails verification for ts-application', () => {
    const repo = makeTempRepo()
    const result = runVerifier(repo, 'ts-application')
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('LICENSE')
    expect(result.stderr).toContain('README.md')
  })

  test('repo with required hygiene files passes', () => {
    const repo = makeTempRepo()
    writeFileSync(join(repo, 'LICENSE'), 'MIT')
    writeFileSync(join(repo, 'README.md'), '# repo')
    writeFileSync(join(repo, '.editorconfig'), '')
    writeFileSync(join(repo, '.gitattributes'), '')
    writeFileSync(join(repo, '.gitignore'), '')
    writeFileSync(join(repo, 'CLAUDE.md'), '# CLAUDE')
    writeFileSync(join(repo, 'package.json'), JSON.stringify({ devDependencies: {} }))

    const result = runVerifier(repo, 'ts-application')
    expect(result.code).toBe(0)
    expect(result.stdout).toContain('shape OK')
  })

  test('rejects unknown kind', () => {
    const repo = makeTempRepo()
    const result = runVerifier(repo, 'this-kind-does-not-exist')
    expect(result.code).not.toBe(0)
  })
})
```

- [ ] **Step 2: Run the test, expect it to fail**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun test tools/verify-repo-shape.test.ts
```
Expected: 3 tests; the first run may pass directly if the implementation is correct on first write. If any fail, inspect the output and tighten the verifier in `tools/verify-repo-shape.ts`.

- [ ] **Step 3: Iterate until all 3 pass**

Common iteration points:
- The verifier reads `kinds/<kind>.yaml` relative to its own location (`__dirname/..`). If the test's working directory differs from the verifier's path, this should still work because we use `resolve(__dirname, '..')`. But verify the `KINDS_DIR` resolves correctly.
- The test invokes the verifier via `bun run`. Bun's CLI flags may reorder; if the verifier sees an empty `--kind`, it's because `bun run`'s argv handling stripped them — switch to `bun "${VERIFIER}" --kind ...` (no `run`).

### Task 7.5: Add a moon project for tools

**Files:**
- Create: `tools/moon.yml`

- [ ] **Step 1: Write `tools/moon.yml`**

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'application'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check verify-repo-shape.ts verify-repo-shape.test.ts'
    inputs:
      - '*.ts'

  test:
    command: 'bun test verify-repo-shape.test.ts'
    inputs:
      - '*.ts'

  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:test'
```

- [ ] **Step 2: Add tools to `.moon/workspace.yml`**

Edit `.moon/workspace.yml` and update the `projects:` block:

```yaml
$schema: 'https://moonrepo.dev/schemas/workspace.json'

projects:
  - 'packages/*'
  - 'tools'

vcs:
  client: 'git'
  defaultBranch: 'main'
```

### Task 7.6: Validate kind manifests against the schema

**Files:**
- Create: `tools/validate-kinds.ts`
- Create: `tools/validate-kinds.test.ts`

- [ ] **Step 1: Write `tools/validate-kinds.ts`**

```typescript
#!/usr/bin/env bun
/**
 * validate-kinds — assert all kinds/*.yaml conform to kinds/_schema.json.
 *
 * Exits 0 if all manifests validate; exits 1 with the first error otherwise.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import AjvLib from 'ajv'
import * as YAML from 'yaml'

// Ajv 8 ships as CJS; under ESM/NodeNext the default may be double-wrapped.
// biome-ignore lint/suspicious/noExplicitAny: CJS interop for Ajv default export
const Ajv = (AjvLib as any).default ?? AjvLib

const __dirname = dirname(fileURLToPath(import.meta.url))
const KINDS_DIR = resolve(__dirname, '..', 'kinds')
const SCHEMA_PATH = join(KINDS_DIR, '_schema.json')

function main(): void {
  // biome-ignore lint/suspicious/noExplicitAny: Ajv constructor type lost after interop unwrap
  const ajv = new Ajv({ allErrors: true }) as any
  // Strip the $schema field so Ajv doesn't attempt to fetch the meta-schema URI
  const { $schema: _s, ...schema } = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')) as Record<
    string,
    unknown
  >
  const validate = ajv.compile(schema)

  const files = readdirSync(KINDS_DIR).filter((f) => f.endsWith('.yaml'))
  let failed = 0

  for (const f of files) {
    const path = join(KINDS_DIR, f)
    const expectedKind = f.replace(/\.yaml$/, '')
    const data = YAML.parse(readFileSync(path, 'utf8'))

    if (data.kind !== expectedKind) {
      // biome-ignore lint/suspicious/noConsole: CLI script
      console.error(`✗ ${f}: kind="${data.kind}" does not match filename`)
      failed++
      continue
    }

    if (!validate(data)) {
      // biome-ignore lint/suspicious/noConsole: CLI script
      console.error(`✗ ${f}: schema validation failed:`)
      for (const err of validate.errors ?? []) {
        // biome-ignore lint/suspicious/noConsole: CLI script
        console.error(`    ${err.instancePath} ${err.message}`)
      }
      failed++
      continue
    }

    // biome-ignore lint/suspicious/noConsole: CLI script
    console.log(`✓ ${f}`)
  }

  if (failed > 0) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.error(`\n${failed}/${files.length} manifest(s) failed`)
    process.exit(1)
  }
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log(`\nAll ${files.length} manifest(s) valid`)
}

main()
```

> **Implementation note (plan defect):** The original plan used `import Ajv from 'ajv'` directly and `ajv.compile(schema)`. Two defects were found during execution:
>
> 1. **Ajv + 2020-12 meta-schema:** Ajv 8 throws `no schema with key or ref "https://json-schema.org/draft/2020-12/schema"` when the schema's `$schema` URI is present. Fix: strip `$schema` from the loaded schema object before compiling.
>
> 2. **Ajv CJS/ESM interop:** Under NodeNext module resolution, `import Ajv from 'ajv'` produces a namespace object without a constructor. Fix: use `(AjvLib as any).default ?? AjvLib` to unwrap the CJS default export.
>
> 3. **`@types/bun` needed:** The root tsconfig (NodeNext, lib ES2023) needs `@types/bun` installed for `bun:test`, `import.meta.url`, `process`, `console` to type-check. Add: `bun add -d @types/bun`.
>
> 4. **`tools/tsconfig.json` needed:** Create a local tsconfig in `tools/` with `"moduleResolution": "Bundler"` and `"types": ["@types/bun"]` so the tools subdir type-checks correctly.
>
> 5. **`noUncheckedIndexedAccess` + `split`:** `w.split('@')[0]` returns `string | undefined` under strict mode. Fix: `w.split('@')[0] ?? w`.

- [ ] **Step 2: Add `ajv` dependency**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun add -d ajv@^8.17.0
```

- [ ] **Step 3: Write `tools/validate-kinds.test.ts`**

```typescript
import { describe, expect, test } from 'bun:test'
import { execSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VALIDATOR = resolve(__dirname, 'validate-kinds.ts')

describe('validate-kinds', () => {
  test('all kinds/*.yaml validate against the schema', () => {
    const stdout = execSync(`bun run "${VALIDATOR}"`, { encoding: 'utf8' })
    expect(stdout).toContain('All')
    expect(stdout).toContain('valid')
  })
})
```

- [ ] **Step 4: Run the validator and the test**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun install
bun run tools/validate-kinds.ts
bun test tools/validate-kinds.test.ts
```
Expected: validator prints `✓ ts-library.yaml` … `✓ polyglot.yaml`, then "All 6 manifest(s) valid". Test passes.

### Task 7.7: Update `tools/moon.yml` to include the kinds validator

- [ ] **Step 1: Edit `tools/moon.yml`**

Update the `tasks:` block to add a `validate-kinds` task:

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'

layer: 'application'
language: 'typescript'

tasks:
  check:
    command: 'bunx biome check verify-repo-shape.ts verify-repo-shape.test.ts validate-kinds.ts validate-kinds.test.ts'
    inputs:
      - '*.ts'

  test:
    command: 'bun test'
    inputs:
      - '*.ts'

  validate-kinds:
    command: 'bun run validate-kinds.ts'
    inputs:
      - '../kinds/**/*.yaml'
      - '../kinds/_schema.json'
      - 'validate-kinds.ts'

  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:test'
      - '~:validate-kinds'
```

### Task 7.8: Self-verify shared-configs against the `ts-application` kind

- [ ] **Step 1: Run the verifier on the repo itself**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun run tools/verify-repo-shape.ts --kind ts-application --repo .
```
Expected: passes (all required hygiene files exist, CLAUDE.md may need to be created).

- [ ] **Step 2: If CLAUDE.md is missing, create it**

Write a minimal `c:/git/fellwork-worktrees/shared-configs-v0/CLAUDE.md` based on `templates/claude/CLAUDE.md.tmpl` with the placeholders filled in:

```markdown
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
```

- [ ] **Step 3: Re-run the verifier**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bun run tools/verify-repo-shape.ts --kind ts-application --repo .
```
Expected: `✓ shape OK`.

### Task 7.9: Final repo-wide CI

- [ ] **Step 1: Run the full pipeline**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx biome check .
bun run tools/validate-kinds.ts
bun run tools/verify-repo-shape.ts --kind ts-application --repo .
bun test tools/
```
Expected: all green.

- [ ] **Step 2: If moon is installed, run moon ci**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx moon run :ci 2>&1 || echo "moon may need 'proto use' first"
```
Expected: passes (or skip if proto/moon aren't fully wired locally — CI in GitHub Actions will run it).

### Task 7.10: Commit Phase 7

- [ ] **Step 1: Commit**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git add kinds tools .moon CLAUDE.md bun.lock package.json
git commit -m "feat(kinds): add 6 repo-kind manifests, repo-shape verifier, and kind-manifest validator"
```

---

## Phase 7 release wrap-up

The plan does not consume the changesets (i.e., does not run `changeset version` and `changeset publish`). That happens after the PR for this work is merged to `main`, and only after each `@fellwork/*` package's first publish is bootstrapped manually with a granular npm token (per spec §5).

### Task R.1: Final summary commit

- [ ] **Step 1: Verify the worktree state**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git log --oneline shared-configs/v0 ^main
```
Expected: ~25-30 commits across all phases.

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
bunx changeset status
```
Expected: 9 packages queued (2 minor, 7 patch).

- [ ] **Step 2: Verify file shape**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
ls
```
Expected at root: `.changeset/`, `.github/`, `.gitattributes`, `.gitignore`, `.moon/`, `.prototools`, `.vscode/`, `CLAUDE.md`, `LICENSE`, `README.md`, `biome.json`, `bun.lock`, `docs/`, `kinds/`, `moon.yml`, `node_modules/`, `package.json`, `packages/`, `templates/`, `tools/`, `tsconfig.json`.

- [ ] **Step 3: Push the branch and open a PR**

```bash
cd c:/git/fellwork-worktrees/shared-configs-v0
git push -u origin shared-configs/v0
gh pr create --title "feat: build shared-configs to v0 (phases 0-7)" --body "$(cat <<'EOF'
## Summary

- Resets the old shared-configs scaffold (pnpm/eslint/prettier/husky → bun/biome/changesets/moon).
- Folds in @fellwork/tsconfig (now packages/tsconfig, bumped to 0.2.0).
- Folds in @fellwork/biome-config (now packages/biome-config, bumped to 0.2.0).
- Adds 7 new packages: oxlint-config, commitlint-config, release-config, renovate-config, markdownlint-config, cspell-config, lefthook-config (each at 0.1.0).
- Adds templates/ with community-health, dotfiles, vscode, claude, and Rust template configs.
- Adds reusable GitHub Actions workflows (ts-ci, rust-ci, npm-release with OIDC, cargo-publish, semver-label-check, verify-repo-shape) and 3 composite actions.
- Adds 6 kinds/ manifests (ts-library, ts-application, nuxt-app, rust-workspace, rust-library, polyglot) plus a JSON Schema and validator.
- Adds tools/verify-repo-shape.ts that asserts a consumer repo matches its kind.

## Scope

Phases 0-7 of [the design spec](docs/superpowers/specs/2026-04-26-fellwork-shared-configs-design.md). Phases 8-10 (adoption in api/web/etc., deprecation of fellwork/tsconfig and fellwork/lint repos) are deferred to a follow-up plan.

## Test plan

- [ ] CI passes
- [ ] biome check . passes
- [ ] tools/validate-kinds.ts validates all 6 manifests
- [ ] tools/verify-repo-shape.ts passes against this repo
- [ ] Each package's tests pass (tsconfig fixtures, biome-config fixtures, etc.)

## Release impact

9 changesets queued (2 minor for fold-ins, 7 patch for new packages at v0.1.0). Each package needs a one-time first-publish bootstrap with a granular npm token before trusted publishing (OIDC) takes over. See spec §5.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR opened. CI runs and (after first push) verifies the workflows on themselves.

---

## Done

After this plan executes successfully, `shared-configs` v0 is ready. To actually publish:

1. Merge the PR.
2. For each of the 9 packages, do the first-publish bootstrap (granular npm token from a maintainer's laptop → publish → register as trusted publisher on npmjs.com → discard token). This is documented in spec §5 and not part of the plan.
3. Tag `v1` and `domain-lint-v1` per `.github/TAGS.md`.
4. Future releases happen via `changesets/action` on push to `main` using OIDC.

The next plan (deferred) handles phases 8-10: adopting shared-configs in `fellwork/api`, `fellwork/web`, `fellwork/bootstrap`, `fellwork/scribe`, `fellwork/ops`, and `fellwork/foreman`, plus archiving the now-empty `fellwork/tsconfig` and `fellwork/lint` repos.
