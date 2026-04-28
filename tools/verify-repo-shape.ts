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
 *
 * Exit codes:
 *   0 - repo shape matches the kind manifest
 *   1 - one or more required files are missing
 *   2 - bad input (--kind missing or kind manifest not found)
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
  // v1 additions (optional, additive)
  target?: ('repo' | 'package')[]
  context?: { required?: string[]; optional?: string[] }
  hooks?: { postInit?: string[]; postSync?: string[]; timeout?: number }
  packagePaths?: string[]
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
    const filename = w.split('@')[0] ?? w // strip @v1 suffix
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
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.error('--kind is required')
    process.exit(2)
  }

  let kind: KindManifest
  try {
    kind = loadKind(values.kind)
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.error((e as Error).message)
    process.exit(2)
  }

  // biome-ignore lint/style/noNonNullAssertion: --repo always has a default; parseArgs typing is loose
  const repoRoot = resolve(values.repo!)
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log(`verifying ${repoRoot} against kind=${kind.kind}`)

  const { missing, warnings } = verify(kind, repoRoot)

  // biome-ignore lint/suspicious/noConsole: CLI script
  for (const w of warnings) console.warn(`  warning: ${w}`)

  if (missing.length === 0) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.log(`✓ shape OK (${warnings.length} warning(s))`)
    process.exit(0)
  }

  // biome-ignore lint/suspicious/noConsole: CLI script
  console.error('\n✗ shape mismatch — missing files:')
  // biome-ignore lint/suspicious/noConsole: CLI script
  for (const m of missing) console.error(`  - ${m}`)
  process.exit(1)
}

main()
