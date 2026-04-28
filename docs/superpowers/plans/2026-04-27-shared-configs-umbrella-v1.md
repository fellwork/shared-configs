# shared-configs Umbrella + Schema Extensions (Plan A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `@fellwork/shared-configs@1.0.0` as an umbrella npm package with a typed public API, extend the kind-manifest schema with four optional fields foreman v1 needs, and add adjacent `*.tmpl.types.ts` files declaring template context types.

**Architecture:** Promote the shared-configs root package from `private: true` to a published umbrella exporting three small library APIs (`./kinds`, `./templates`, `./manifest-schema`). Build with rolldown for `.d.ts` emission. Schema gets `target`, `context`, `hooks`, `packagePaths` fields — all optional, all additive, existing manifests stay valid. Each `*.tmpl` file in `templates/` gets an adjacent `*.tmpl.types.ts` file declaring its `Context` type, which foreman will type-check renders against.

**Tech Stack:** Bun workspace, TypeScript 5.6+, rolldown + rolldown-plugin-dts, biome, vitest, ajv 8, yaml, changesets, GitHub Actions OIDC publishing.

**Plan A in a three-plan series.** Plan B (foreman v1) imports from this umbrella. Plan C (Foreman.psd1) is downstream of Plan B. Land Plan A first and publish before starting Plan B.

---

## File Structure

### Created files (12)

| Path | Responsibility |
|---|---|
| `src/kinds.ts` | Public API: `loadKind`, `listKinds`, `kindsDir` |
| `src/templates.ts` | Public API: `templatePath`, `listTemplates`, `templatesDir` |
| `src/manifest-schema.ts` | Public API: `manifestSchema` (the JSON schema as a TS const) |
| `src/types.ts` | TS interface `KindManifest` matching the schema |
| `src/index.ts` | Re-exports all three modules |
| `rolldown.config.ts` | Build config emitting `dist/` with `.d.ts` files |
| `tests/kinds.test.ts` | Unit tests for kinds API |
| `tests/templates.test.ts` | Unit tests for templates API |
| `tests/manifest-schema.test.ts` | Tests asserting schema is valid JSON Schema and matches existing manifests |
| `templates/README.md.tmpl.types.ts` | Context type for README template |
| `templates/fly.toml.tmpl.types.ts` | Context type for fly.toml template |
| `tests/template-types.test.ts` | Test asserting every `*.tmpl` has a sibling `*.tmpl.types.ts` |

### Modified files (3)

| Path | Why |
|---|---|
| `package.json` (root) | Remove `private: true`, add `name`/`version`/`exports`/`files`/`scripts.build`, add rolldown devdeps |
| `kinds/_schema.json` | Add `target`, `context`, `hooks`, `packagePaths` fields |
| `tools/validate-kinds.ts` | Update inline KindManifest type to include new fields (no logic change required since schema validation is data-driven) |

### Out of scope for Plan A (deferred to Plan B or beyond)

- Refactoring `tools/verify-repo-shape.ts` to use the umbrella (deferred — see spec Section "Cross-repo work in shared-configs"). v1 just ensures the surface area is right; the refactor is post-v1.
- Cross-repo contract test that installs foreman from npm. That CI work lands in Plan B's contract-tests phase, after foreman is published.

---

## Task 1: Add the four optional fields to the kind-manifest JSON schema

**Files:**
- Modify: `kinds/_schema.json` (add four optional properties)
- Test: `tools/validate-kinds.test.ts` (existing) — must continue to pass

- [ ] **Step 1: Read the current schema**

Run: `cat kinds/_schema.json | head -20`
Expected: shows `additionalProperties: false` and existing properties.

- [ ] **Step 2: Edit `kinds/_schema.json` to add the four new properties before the closing `}` of the top-level `properties` object**

Add these property definitions inside `properties` (after the existing `scripts` property):

```json
    "target": {
      "type": "array",
      "items": { "type": "string", "enum": ["repo", "package"] },
      "uniqueItems": true,
      "description": "Where this kind can be created: as a top-level repo, an in-monorepo package, or both."
    },
    "context": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "required": {
          "type": "array",
          "items": { "type": "string" }
        },
        "optional": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "description": "Template variables foreman provides. `required` must be supplied at creation time; `optional` may be defaulted."
    },
    "hooks": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "postInit": {
          "type": "array",
          "items": { "type": "string" }
        },
        "postSync": {
          "type": "array",
          "items": { "type": "string" }
        },
        "timeout": {
          "type": "integer",
          "minimum": 1,
          "description": "Default seconds; overridable per-hook in future variants."
        }
      },
      "description": "Foreman lifecycle hooks. Commands run as child processes."
    },
    "packagePaths": {
      "type": "array",
      "items": { "type": "string" },
      "description": "For monorepo kinds: where in-repo packages can live (e.g., 'packages/', 'apps/'). Used by `foreman new package`."
    }
```

- [ ] **Step 3: Run the existing kind validator to confirm existing manifests still validate**

Run: `bun run tools/validate-kinds.ts`
Expected: `OK: 6 manifest(s) validated` (or equivalent success). All 6 existing kinds (`nuxt-app`, `polyglot`, `rust-library`, `rust-workspace`, `ts-application`, `ts-library`) must continue to validate — the new fields are optional.

- [ ] **Step 4: Run the validate-kinds tests**

Run: `bun run tools/validate-kinds.test.ts` (or `bun test tools/validate-kinds.test.ts` — match the existing test runner)
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add kinds/_schema.json
git commit -m "feat(kinds): add optional target/context/hooks/packagePaths schema fields

Additive fields foreman v1 consumes. All optional; existing manifests
stay valid."
```

---

## Task 2: Update the inline `KindManifest` type in `tools/validate-kinds.ts`

**Files:**
- Modify: `tools/validate-kinds.ts` — add the new fields to its TypeScript shape (validation is data-driven, so no logic change needed; this just keeps the local type honest)

- [ ] **Step 1: Read the current inline type**

Run: `head -50 tools/validate-kinds.ts`
Expected: file currently does not declare a top-level `KindManifest` interface (only `verify-repo-shape.ts` does). Confirm by grepping.

Run: `grep -n "interface KindManifest" tools/validate-kinds.ts`
Expected: no matches.

- [ ] **Step 2: Verify `tools/verify-repo-shape.ts` interface needs updating instead**

Run: `grep -n "interface KindManifest" tools/verify-repo-shape.ts`
Expected: one match around line 24.

- [ ] **Step 3: Edit `tools/verify-repo-shape.ts` to add the four fields to the `KindManifest` interface**

Replace the existing `KindManifest` interface (around lines 24-33) with:

```typescript
interface KindManifest {
  kind: string
  description: string
  extends?: string
  templates?: string[]
  workflows?: string[]
  packages?: { devDependencies?: string[] }
  tsconfig?: { extends?: string[] }
  cargo?: Record<string, unknown>
  // v1 additions (optional, additive)
  target?: ('repo' | 'package')[]
  context?: { required?: string[]; optional?: string[] }
  hooks?: { postInit?: string[]; postSync?: string[]; timeout?: number }
  packagePaths?: string[]
}
```

- [ ] **Step 4: Typecheck**

Run: `bun run tsc --noEmit -p tsconfig.json` (or the existing typecheck task: `moon run :typecheck` if defined; check `moon.yml`)
Expected: no errors.

- [ ] **Step 5: Run verify-repo-shape tests**

Run: `bun test tools/verify-repo-shape.test.ts`
Expected: PASS (existing tests). The new fields are optional, so existing fixtures don't need to declare them.

- [ ] **Step 6: Commit**

```bash
git add tools/verify-repo-shape.ts
git commit -m "chore(tools): extend KindManifest interface with v1 schema fields"
```

---

## Task 3: Add a fixture-based test asserting the new fields are accepted

**Files:**
- Create: `tools/fixtures/kinds-with-v1-fields.yaml`
- Create: `tools/fixtures/kinds-with-v1-fields.test.ts` (or extend existing test file if pattern is to consolidate — check `tools/validate-kinds.test.ts` first)

- [ ] **Step 1: Inspect existing fixture pattern**

Run: `ls tools/fixtures/ 2>&1`
Expected: shows existing fixture files.

Run: `cat tools/validate-kinds.test.ts | head -50`
Expected: shows how fixtures are loaded.

- [ ] **Step 2: Create a fixture YAML using all four new fields**

Path: `tools/fixtures/kind-with-v1-fields.yaml`

```yaml
kind: test-v1-fields
description: Fixture exercising all v1-additions fields
target:
  - repo
  - package
context:
  required:
    - name
    - description
  optional:
    - author
hooks:
  postInit:
    - 'echo init'
  postSync:
    - 'echo sync'
  timeout: 600
packagePaths:
  - packages/
  - apps/
```

- [ ] **Step 3: Add a test asserting the fixture validates against the schema**

Decide whether to add a new file or extend `validate-kinds.test.ts`. If existing tests already iterate `tools/fixtures/*.yaml`, the fixture is auto-covered. If not, add to the existing test file:

```typescript
import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import AjvLib from 'ajv'
import * as YAML from 'yaml'

// biome-ignore lint/suspicious/noExplicitAny: CJS interop for Ajv default export
const Ajv = (AjvLib as any).default ?? AjvLib

test('schema accepts all v1-addition fields', () => {
  const schema = JSON.parse(readFileSync(join(import.meta.dir, '..', 'kinds', '_schema.json'), 'utf8'))
  delete schema.$schema
  // biome-ignore lint/suspicious/noExplicitAny: ajv interop
  const ajv = new Ajv({ allErrors: true }) as any
  const validate = ajv.compile(schema)
  const fixture = YAML.parse(
    readFileSync(join(import.meta.dir, 'fixtures', 'kind-with-v1-fields.yaml'), 'utf8'),
  )
  const ok = validate(fixture)
  if (!ok) {
    // biome-ignore lint/suspicious/noConsole: test diagnostic
    console.error(validate.errors)
  }
  expect(ok).toBe(true)
})
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test tools/validate-kinds.test.ts`
Expected: new test passes.

- [ ] **Step 5: Commit**

```bash
git add tools/fixtures/kind-with-v1-fields.yaml tools/validate-kinds.test.ts
git commit -m "test(kinds): assert v1 schema additions accept all four fields"
```

---

## Task 4: Add adjacent `*.tmpl.types.ts` files for existing templates

**Files:**
- Create: `templates/README.md.tmpl.types.ts`
- Create: `templates/fly.toml.tmpl.types.ts`

- [ ] **Step 1: Inspect each template to enumerate variables**

Run: `cat templates/README.md.tmpl`
Expected: vars `{{repo_name}}` and `{{description}}`.

Run: `cat templates/fly.toml.tmpl`
Expected: vars `{{app_name}}`, `{{primary_region}}`, `{{internal_port}}`.

- [ ] **Step 2: Create `templates/README.md.tmpl.types.ts`**

```typescript
/**
 * Context type for templates/README.md.tmpl.
 * Foreman type-checks renders against this shape.
 */
export type Context = {
  repo_name: string
  description: string
}
```

- [ ] **Step 3: Create `templates/fly.toml.tmpl.types.ts`**

```typescript
/**
 * Context type for templates/fly.toml.tmpl.
 */
export type Context = {
  app_name: string
  primary_region: string
  internal_port: number
}
```

- [ ] **Step 4: Typecheck (no compile errors expected since these are isolated declarations)**

Run: `bun run tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add templates/README.md.tmpl.types.ts templates/fly.toml.tmpl.types.ts
git commit -m "feat(templates): add adjacent *.tmpl.types.ts context type files

Each *.tmpl file gets a sibling *.tmpl.types.ts declaring its render
context type. Foreman uses these to type-check renders."
```

---

## Task 5: Add the test asserting every `*.tmpl` has a sibling `*.tmpl.types.ts`

**Files:**
- Create: `tools/template-types.test.ts`

- [ ] **Step 1: Write the failing test**

Path: `tools/template-types.test.ts`

```typescript
import { test, expect } from 'bun:test'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const TEMPLATES_DIR = resolve(import.meta.dir, '..', 'templates')

function findTmplFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      findTmplFiles(path, acc)
    } else if (entry.name.endsWith('.tmpl')) {
      acc.push(path)
    }
  }
  return acc
}

test('every *.tmpl file has a sibling *.tmpl.types.ts file', () => {
  const tmplFiles = findTmplFiles(TEMPLATES_DIR)
  expect(tmplFiles.length).toBeGreaterThan(0)

  const missing: string[] = []
  for (const tmpl of tmplFiles) {
    const typesPath = `${tmpl}.types.ts`
    if (!existsSync(typesPath)) missing.push(typesPath)
  }
  expect(missing).toEqual([])
})
```

- [ ] **Step 2: Run the test to verify it passes (since Task 4 added both type files)**

Run: `bun test tools/template-types.test.ts`
Expected: PASS — both `README.md.tmpl.types.ts` and `fly.toml.tmpl.types.ts` exist.

- [ ] **Step 3: Verify the test would actually fail if a type file is missing (sanity check)**

Run: `mv templates/README.md.tmpl.types.ts templates/README.md.tmpl.types.ts.bak && bun test tools/template-types.test.ts; mv templates/README.md.tmpl.types.ts.bak templates/README.md.tmpl.types.ts`
Expected: test FAILS while the file is moved away, then file is restored.

- [ ] **Step 4: Commit**

```bash
git add tools/template-types.test.ts
git commit -m "test(templates): assert every *.tmpl has a sibling *.tmpl.types.ts"
```

---

## Task 6: Create the umbrella package source files

**Files:**
- Create: `src/types.ts`
- Create: `src/manifest-schema.ts`
- Create: `src/kinds.ts`
- Create: `src/templates.ts`
- Create: `src/index.ts`

- [ ] **Step 1: Create `src/types.ts`**

```typescript
/**
 * TypeScript shape of a kind manifest, mirroring kinds/_schema.json.
 * Update both files together when the schema changes.
 */

export interface KindManifest {
  kind: string
  description: string
  extends?: string
  templates?: string[]
  workflows?: string[]
  packages?: {
    devDependencies?: string[]
    peerDependencies?: { name: string; version: string }[]
  }
  tsconfig?: {
    extends?: string[]
    include?: string[]
  }
  cargo?: Record<string, unknown>
  renovate?: { extends?: string }
  scripts?: Record<string, string>

  // v1 additions
  target?: ('repo' | 'package')[]
  context?: {
    required?: string[]
    optional?: string[]
  }
  hooks?: {
    postInit?: string[]
    postSync?: string[]
    timeout?: number
  }
  packagePaths?: string[]
}
```

- [ ] **Step 2: Create `src/manifest-schema.ts`**

```typescript
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Path to the kind-manifest JSON Schema. The schema itself is shipped in the
 * package files; consumers can read it directly or import the parsed object.
 */
export const manifestSchemaPath: string = resolve(
  __dirname,
  '..',
  'kinds',
  '_schema.json',
)

/**
 * Parsed JSON Schema for kind manifests. Strips the `$schema` field so Ajv
 * does not attempt to fetch the meta-schema URI.
 */
export const manifestSchema: Record<string, unknown> = (() => {
  const raw = JSON.parse(readFileSync(manifestSchemaPath, 'utf8')) as Record<string, unknown>
  // biome-ignore lint/correctness/noUnusedVariables: destructure-and-discard
  const { $schema: _s, ...rest } = raw
  return rest
})()
```

- [ ] **Step 3: Create `src/kinds.ts`**

```typescript
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as YAML from 'yaml'
import type { KindManifest } from './types.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Absolute path to the kinds/ directory shipped with this package.
 * Useful when consumers need to enumerate or stream raw YAML.
 */
export const kindsDir: string = resolve(__dirname, '..', 'kinds')

/**
 * List all available kind names (filenames in kinds/ minus `.yaml`,
 * excluding the schema file).
 */
export function listKinds(): string[] {
  return readdirSync(kindsDir)
    .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
    .map((f) => f.replace(/\.yaml$/, ''))
    .sort()
}

/**
 * Load a kind manifest by name. Does NOT resolve `extends:` — that is the
 * consumer's responsibility (foreman handles it via deep-merge).
 *
 * Throws if the kind does not exist or the YAML fails to parse.
 */
export function loadKind(name: string): KindManifest {
  const path = join(kindsDir, `${name}.yaml`)
  if (!existsSync(path)) {
    throw new Error(`Kind manifest not found: ${name} (looked in ${kindsDir})`)
  }
  return YAML.parse(readFileSync(path, 'utf8')) as KindManifest
}
```

- [ ] **Step 4: Create `src/templates.ts`**

```typescript
import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Absolute path to the templates/ directory shipped with this package.
 */
export const templatesDir: string = resolve(__dirname, '..', 'templates')

/**
 * Resolve a template's absolute path. Accepts the same relative form a kind
 * manifest declares (e.g. `'gitignore/node'`, `'README.md.tmpl'`).
 *
 * Throws if the template does not exist.
 */
export function templatePath(relative: string): string {
  const path = join(templatesDir, relative)
  if (!existsSync(path)) {
    throw new Error(`Template not found: ${relative} (looked in ${templatesDir})`)
  }
  return path
}

/**
 * List all template files (recursive). Returns paths relative to templatesDir.
 * Excludes `*.tmpl.types.ts` adjacent type files.
 */
export function listTemplates(): string[] {
  const out: string[] = []
  walk(templatesDir, '', out)
  return out.sort()
}

function walk(absDir: string, relDir: string, out: string[]): void {
  for (const entry of readdirSync(absDir)) {
    const abs = join(absDir, entry)
    const rel = relDir ? `${relDir}/${entry}` : entry
    if (statSync(abs).isDirectory()) {
      walk(abs, rel, out)
    } else if (!entry.endsWith('.tmpl.types.ts')) {
      out.push(rel)
    }
  }
}
```

- [ ] **Step 5: Create `src/index.ts`**

```typescript
export { loadKind, listKinds, kindsDir } from './kinds.ts'
export { templatePath, listTemplates, templatesDir } from './templates.ts'
export { manifestSchema, manifestSchemaPath } from './manifest-schema.ts'
export type { KindManifest } from './types.ts'
```

- [ ] **Step 6: Typecheck the new sources**

Run: `bun run tsc --noEmit -p tsconfig.json`
Expected: no errors. (If `tsconfig.json`'s `include` does not yet cover `src/`, fix it as part of Task 8.)

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat(umbrella): add public API source files (kinds, templates, schema)

Three small library APIs that foreman imports: loadKind/listKinds,
templatePath/listTemplates, manifestSchema. Re-exported from src/index.ts."
```

---

## Task 7: Add unit tests for the umbrella's public API

**Files:**
- Create: `tests/kinds.test.ts`
- Create: `tests/templates.test.ts`
- Create: `tests/manifest-schema.test.ts`

- [ ] **Step 1: Create `tests/kinds.test.ts`**

```typescript
import { test, expect } from 'bun:test'
import { loadKind, listKinds, kindsDir } from '../src/kinds.ts'

test('listKinds returns all six v1 kinds, sorted', () => {
  const kinds = listKinds()
  expect(kinds).toEqual([
    'nuxt-app',
    'polyglot',
    'rust-library',
    'rust-workspace',
    'ts-application',
    'ts-library',
  ])
})

test('listKinds excludes the schema file', () => {
  const kinds = listKinds()
  expect(kinds).not.toContain('_schema')
})

test('loadKind returns a parsed manifest', () => {
  const m = loadKind('ts-library')
  expect(m.kind).toBe('ts-library')
  expect(typeof m.description).toBe('string')
})

test('loadKind throws on unknown kind', () => {
  expect(() => loadKind('does-not-exist')).toThrow(/not found/)
})

test('kindsDir is an absolute path ending in `kinds`', () => {
  expect(kindsDir).toMatch(/[\\/]kinds$/)
})
```

- [ ] **Step 2: Create `tests/templates.test.ts`**

```typescript
import { test, expect } from 'bun:test'
import { existsSync } from 'node:fs'
import { templatePath, listTemplates, templatesDir } from '../src/templates.ts'

test('templatePath resolves an existing template', () => {
  const p = templatePath('README.md.tmpl')
  expect(existsSync(p)).toBe(true)
})

test('templatePath throws on missing template', () => {
  expect(() => templatePath('does-not-exist.tmpl')).toThrow(/not found/)
})

test('listTemplates includes README.md.tmpl and excludes *.tmpl.types.ts', () => {
  const items = listTemplates()
  expect(items).toContain('README.md.tmpl')
  expect(items.some((p) => p.endsWith('.tmpl.types.ts'))).toBe(false)
})

test('templatesDir is an absolute path ending in `templates`', () => {
  expect(templatesDir).toMatch(/[\\/]templates$/)
})
```

- [ ] **Step 3: Create `tests/manifest-schema.test.ts`**

```typescript
import { test, expect } from 'bun:test'
import AjvLib from 'ajv'
import { loadKind, listKinds } from '../src/kinds.ts'
import { manifestSchema } from '../src/manifest-schema.ts'

// biome-ignore lint/suspicious/noExplicitAny: CJS interop for Ajv default export
const Ajv = (AjvLib as any).default ?? AjvLib

test('manifestSchema is a valid Ajv schema and accepts every shipped manifest', () => {
  // biome-ignore lint/suspicious/noExplicitAny: ajv interop
  const ajv = new Ajv({ allErrors: true }) as any
  const validate = ajv.compile(manifestSchema)

  const failures: { kind: string; errors: unknown }[] = []
  for (const name of listKinds()) {
    const m = loadKind(name)
    if (!validate(m)) {
      failures.push({ kind: name, errors: validate.errors })
    }
  }
  expect(failures).toEqual([])
})
```

- [ ] **Step 4: Run the new tests**

Run: `bun test tests/`
Expected: 9 tests pass (5 in kinds, 4 in templates, 1 in manifest-schema).

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test(umbrella): unit tests for kinds, templates, manifest-schema APIs"
```

---

## Task 8: Configure `tsconfig.json` to include `src/` and `tests/`

**Files:**
- Modify: `tsconfig.json` (root)

- [ ] **Step 1: Read the current tsconfig**

Run: `cat tsconfig.json`
Expected: shows current `include` (likely covers `tools/`, may or may not cover `src/`).

- [ ] **Step 2: Edit `tsconfig.json` to ensure `src/` and `tests/` are included**

If `include` is missing `src` and `tests`, add them. Example shape (adapt to existing structure):

```json
{
  "extends": "@fellwork/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts", "tools/**/*.ts", "templates/**/*.ts"]
}
```

Note: `templates/**/*.ts` is included so the `*.tmpl.types.ts` files compile-check. They are not bundled into `dist/` by rolldown (rolldown's input is `src/index.ts` only).

- [ ] **Step 3: Typecheck**

Run: `bun run tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json
git commit -m "chore(tsconfig): include src/, tests/, templates/ for typechecking"
```

---

## Task 9: Add rolldown build config and devdeps

**Files:**
- Create: `rolldown.config.ts`
- Modify: `package.json` (root) — add devdeps for `rolldown`, `rolldown-plugin-dts`

- [ ] **Step 1: Add devdeps**

Run: `bun add -d rolldown rolldown-plugin-dts`
Expected: both packages added under `devDependencies`.

- [ ] **Step 2: Create `rolldown.config.ts`**

```typescript
import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
  },
  external: ['node:fs', 'node:path', 'node:url', 'yaml'],
  plugins: [dts()],
})
```

- [ ] **Step 3: Run the build**

Run: `bunx rolldown -c`
Expected: produces `dist/index.js` and `dist/index.d.ts`.

Run: `ls dist/`
Expected: `index.js`, `index.d.ts`, `index.js.map`.

- [ ] **Step 4: Inspect the generated `.d.ts` to confirm types are exported**

Run: `cat dist/index.d.ts`
Expected: contains exports for `loadKind`, `listKinds`, `templatePath`, `listTemplates`, `manifestSchema`, `KindManifest`.

- [ ] **Step 5: Commit**

```bash
git add rolldown.config.ts package.json bun.lock
git commit -m "build(umbrella): rolldown config emitting dist/ with .d.ts files"
```

---

## Task 10: Promote root `package.json` to a publishable umbrella

**Files:**
- Modify: `package.json` (root) — name, version, exports, files, scripts.build, remove `private: true`

- [ ] **Step 1: Read current root package.json**

Run: `cat package.json`
Expected: `private: true`, `name: shared-configs`, no `exports` block.

- [ ] **Step 2: Edit `package.json` — apply these changes**

Apply these specific changes (preserve all other fields not listed):

- Change `"name": "shared-configs"` to `"name": "@fellwork/shared-configs"`
- Add `"version": "1.0.0"` (after `"name"`)
- Remove `"private": true`
- Add at the top level:
  ```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./kinds": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./templates": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./manifest-schema": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "kinds",
    "templates",
    "!templates/**/*.tmpl.types.ts"
  ],
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": false
  ```
- Add to `scripts`:
  ```json
  "build": "rolldown -c",
  "prepack": "bun run build"
  ```

  (`prepack` ensures `dist/` is fresh on every publish without requiring CI to remember.)

Note on the four sub-paths: in v1 every sub-path resolves to the same `dist/index.js` because the umbrella exports everything from one bundle. The named sub-paths exist so foreman's imports are semantically clear (`import { loadKind } from '@fellwork/shared-configs/kinds'`) and so we can split bundles later without breaking consumers.

Note on `files`: `kinds/` and `templates/` ship as raw source so consumers can read YAML and template files at runtime. `*.tmpl.types.ts` is excluded — it's a build-time/type-check artifact, not a runtime asset.

- [ ] **Step 3: Run `bun install` to refresh the lockfile**

Run: `bun install`
Expected: lockfile updates without error.

- [ ] **Step 4: Verify the package would pack correctly**

Run: `bun pm pack --dry-run`
Expected: lists `dist/`, `kinds/`, `templates/` (excluding `*.tmpl.types.ts`), `package.json`. No source files (`src/`, `tests/`, `tools/`).

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock
git commit -m "feat(umbrella): publish root as @fellwork/shared-configs@1.0.0

Promotes the root package from private to a published umbrella.
Exports kinds/, templates/, manifest-schema sub-paths (all currently
resolving to the single dist/index.js bundle). Ships dist/ + raw kinds/
+ raw templates/; excludes *.tmpl.types.ts from the published payload."
```

---

## Task 11: Add a moon task for `build` and wire it into `:ci`

**Files:**
- Modify: `moon.yml` (root)
- Modify: `.moon/tasks.yml` if a workspace-level task graph is needed (check first)

- [ ] **Step 1: Inspect current root moon.yml**

Run: `cat moon.yml`
Expected: shows the `:ci` task with deps on `~:check`, `packages.*:check`, `packages.*:test`.

- [ ] **Step 2: Add `build` task and wire it into `ci`**

Edit `moon.yml`. Add a new task:

```yaml
  build:
    command: 'bunx rolldown -c'
    inputs:
      - 'src/**/*.ts'
      - 'tsconfig.json'
      - 'rolldown.config.ts'
    outputs:
      - 'dist/**/*'
```

Add `~:build` to the `ci` task's `deps`:

```yaml
  ci:
    command: 'noop'
    deps:
      - '~:check'
      - '~:build'
      - 'packages.*:check'
      - 'packages.*:test'
```

- [ ] **Step 3: Verify moon picks up the change**

Run: `moon run :build`
Expected: runs rolldown and produces `dist/`.

Run: `moon run :ci`
Expected: passes locally.

- [ ] **Step 4: Commit**

```bash
git add moon.yml
git commit -m "build(moon): wire umbrella build into :ci task graph"
```

---

## Task 12: Add a changeset for the umbrella's 1.0.0 release

**Files:**
- Create: `.changeset/<random>-shared-configs-umbrella-v1.md`

- [ ] **Step 1: Generate a changeset**

Run: `bun run changeset`
Expected: prompts for which packages changed and bump type. Select `@fellwork/shared-configs`, choose **major** (this is its 0.x → 1.0.0 transition treated as a public-API commitment).

If interactive prompts don't fit the workflow, create the changeset file manually:

Path: `.changeset/shared-configs-umbrella-v1.md`

```markdown
---
'@fellwork/shared-configs': major
---

Publish `@fellwork/shared-configs@1.0.0` as an umbrella npm package.

- Public API: `loadKind`, `listKinds`, `kindsDir`, `templatePath`, `listTemplates`, `templatesDir`, `manifestSchema`, `manifestSchemaPath`, `KindManifest`
- Schema additions: optional `target`, `context`, `hooks`, `packagePaths` fields on every kind manifest
- Adjacent `*.tmpl.types.ts` files declare each template's render context type
- Consumed by `@fellwork/foreman` (Plan B)
```

- [ ] **Step 2: Verify the changeset is picked up**

Run: `bun run changeset status`
Expected: shows `@fellwork/shared-configs` queued for a major bump.

- [ ] **Step 3: Commit**

```bash
git add .changeset/
git commit -m "chore(changeset): @fellwork/shared-configs@1.0.0 (umbrella + v1 schema)"
```

---

## Task 13: Update README to document the umbrella API

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README**

Run: `cat README.md | head -60`
Expected: shows the existing structure.

- [ ] **Step 2: Add a "## Umbrella API" section after the "What lives here" section**

Insert this block:

```markdown
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

const kinds = listKinds()                // ['nuxt-app', 'polyglot', ...]
const m = loadKind('ts-library')         // KindManifest
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
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): document umbrella API and v1 schema additions"
```

---

## Task 14: Final verification across the whole package

**Files:** none modified

- [ ] **Step 1: Run the full CI task locally**

Run: `moon run :ci`
Expected: all stages pass (root check + build + every workspace package's check + test).

- [ ] **Step 2: Run typecheck explicitly**

Run: `bun run tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Verify pack output**

Run: `bun pm pack --dry-run`
Expected: includes `dist/index.js`, `dist/index.d.ts`, `kinds/*.yaml`, `kinds/_schema.json`, `templates/**` (excluding `*.tmpl.types.ts`), `package.json`. Excludes `src/`, `tests/`, `tools/`, `node_modules/`, `.changeset/`.

- [ ] **Step 4: Smoke-test the built bundle in isolation**

Run: `bun run -e "import('./dist/index.js').then(m => { console.log(Object.keys(m).sort()); console.log(m.listKinds()); })"`
Expected output (order may vary by JS engine but the keys are stable):

```
['KindManifest', 'kindsDir', 'listKinds', 'listTemplates', 'loadKind', 'manifestSchema', 'manifestSchemaPath', 'templatePath', 'templatesDir']
['nuxt-app', 'polyglot', 'rust-library', 'rust-workspace', 'ts-application', 'ts-library']
```

(`KindManifest` shows up because rolldown emits the type re-export name in the JS module's metadata; this is expected.)

- [ ] **Step 5: Run all tests including the existing ones**

Run: `bun test`
Expected: every test passes (existing `tools/` tests + new `tests/` tests + new template-types test).

- [ ] **Step 6: Confirm the changeset is still queued**

Run: `bun run changeset status`
Expected: shows `@fellwork/shared-configs` queued for major bump.

- [ ] **Step 7: Final summary commit (optional, if any small fixups landed during verification)**

If any small fixups were made during verification, commit them with a `chore: post-verification fixups` message. Otherwise skip.

---

## Task 15: Land Plan A and tag the release

**Files:** none modified directly; this is the release flow.

- [ ] **Step 1: Open a PR**

```bash
git push origin <current-branch>
gh pr create --title "feat: @fellwork/shared-configs umbrella v1.0.0 + foreman v1 schema additions" --body "$(cat <<'EOF'
## Summary

Plan A in the foreman v1 series. Promotes the shared-configs root from
`private: true` to a published umbrella `@fellwork/shared-configs@1.0.0`,
extends the kind-manifest schema with four optional fields foreman v1
consumes, and adds adjacent `*.tmpl.types.ts` files for every existing
template.

- Public API: `loadKind`, `listKinds`, `templatePath`, `listTemplates`, `manifestSchema`, `KindManifest`
- Schema additions: `target`, `context`, `hooks`, `packagePaths` (all optional, additive)
- Build via rolldown emitting `dist/index.js` + `dist/index.d.ts`
- Files included in published payload: `dist/`, `kinds/`, `templates/` (excluding `*.tmpl.types.ts`)

## Spec

See `docs/superpowers/specs/2026-04-27-foreman-v1-design.md` Section
"Cross-repo work in shared-configs" (lives in fellwork/foreman).

## Test plan

- [x] All existing tests pass (`bun test`)
- [x] Six existing manifests still validate against the schema
- [x] New schema fields accepted by Ajv with a fixture exercising all four
- [x] Build emits dist/ with correct .d.ts
- [x] `bun pm pack --dry-run` shows the right payload
- [x] Smoke-test of built bundle imports correctly

## Downstream

Plan B (foreman v1) imports from this umbrella once published.
EOF
)"
```

- [ ] **Step 2: Merge after CI passes**

Wait for the GitHub Actions CI to go green. Squash-merge or merge-commit per the repo's convention. Confirm `@fellwork/shared-configs@1.0.0` publishes via the npm release workflow on merge to main.

Run: `gh pr view <PR#> --json mergeable,statusCheckRollup`
Expected: `MERGEABLE`, all checks passing.

- [ ] **Step 3: Verify the npm package is live**

After merge, the changesets release workflow runs. Confirm:

Run: `npm view @fellwork/shared-configs version`
Expected: `1.0.0` (after the release workflow completes — may take a few minutes).

If the workflow doesn't auto-release on the first major-version transition, manually trigger the release per the repo's existing process.

- [ ] **Step 4: Move to Plan B**

Plan A is done. Proceed to Plan B (foreman v1) in the `foreman` repo. Plan B's first dep on this umbrella is in its skeleton phase — `@fellwork/shared-configs` becomes a workspace dep there.

---

## Self-Review Notes

**Spec coverage check:** every requirement in the spec's "Cross-repo work in shared-configs" section maps to at least one task above (umbrella publishing → Tasks 6, 9, 10, 11, 13; schema field additions → Tasks 1, 2, 3; `*.tmpl.types.ts` files → Tasks 4, 5). The `verify-repo-shape.ts` refactor is explicitly out of scope per "Out of scope for Plan A" — deferred per the spec.

**Type consistency:** all references to `KindManifest`, `loadKind`, `listKinds`, `templatePath`, `listTemplates`, `manifestSchema`, `kindsDir`, `templatesDir`, `manifestSchemaPath` use the same names across tasks. The `Context` type in `*.tmpl.types.ts` files is named consistently (single export per file).

**Placeholder scan:** no TBD/TODO/FIXME placeholders. Every code step contains the actual code or shell commands to run.
