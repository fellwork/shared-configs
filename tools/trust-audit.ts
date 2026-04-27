#!/usr/bin/env bun
/**
 * trust-audit — verify OIDC-based publishing config across workspace packages.
 *
 * Path B implementation (workflow-side audit). Reads the repo's
 * .github/workflows/<workflow>.yml (default release.yml) and verifies it:
 *   - Has `id-token: write` permission
 *   - Does NOT reference NPM_TOKEN as a secret (only in comments)
 *
 * If the workflow delegates to a local reusable workflow via
 * `uses: ./.github/workflows/<name>`, those referenced files are also
 * checked recursively for the above constraints.
 *
 * This is a fallback for Path A (registry-side audit). Path A would verify
 * each @fellwork/* package's trusted-publisher state via the npm registry
 * HTTP API. Path A is deferred to v0.2 because:
 *
 *   - The npm registry /-/v1/search endpoint DOES expose a trustedPublisher
 *     field publicly (no auth needed), but only when the most recent publish
 *     was performed via the OIDC workflow.
 *   - Path A would produce false negatives for packages whose last publish
 *     was a manual laptop bootstrap (the v0 launch state).
 *   - Once the first OIDC-driven release runs (next changeset publish on
 *     main), Path A becomes natively feasible.
 *
 * Workflow-side audit is the security-critical check anyway: it confirms the
 * release pipeline INTENT is OIDC-only and prevents accidental re-introduction
 * of NPM_TOKEN. The workflow file is the authoritative enforcement point.
 *
 * Per tools-roadmap spec §5.3 (Item 4) and Appendix B.
 *
 * Exit codes:
 *   0 - workflow is OIDC-only (no NPM_TOKEN, has id-token: write)
 *   1 - workflow violates OIDC-only contract (token present, or permission missing)
 *   2 - bad input (workflow file missing, repo unreadable)
 */

import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { discoverPackages } from './lib/discover-packages.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_REPO_ROOT = resolve(__dirname, '..')

interface AuditFinding {
  package: string
  status: 'OK' | 'FAIL'
  reasons: string[]
}

/**
 * Extract local reusable workflow references from a workflow file's content.
 * Matches patterns like: uses: ./.github/workflows/foo.yml
 */
function extractLocalWorkflowRefs(content: string): string[] {
  const refs: string[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) continue
    const match = trimmed.match(/uses:\s+\.\/\.github\/workflows\/([^\s#]+)/)
    if (match?.[1]) {
      refs.push(match[1])
    }
  }
  return refs
}

/**
 * Collect the set of workflow files to inspect, following local `uses:` references.
 */
function collectWorkflowFiles(
  workflowsDir: string,
  entryName: string,
  visited = new Set<string>(),
): string[] {
  if (visited.has(entryName)) return []
  visited.add(entryName)

  const filePath = join(workflowsDir, entryName)
  if (!existsSync(filePath)) return [entryName] // Return name so caller can report missing

  const content = readFileSync(filePath, 'utf8')
  const result = [entryName]

  for (const ref of extractLocalWorkflowRefs(content)) {
    result.push(...collectWorkflowFiles(workflowsDir, ref, visited))
  }

  return result
}

function checkWorkflowFile(workflowPath: string): { ok: boolean; reasons: string[] } {
  if (!existsSync(workflowPath)) {
    return { ok: false, reasons: [`workflow file not found: ${basename(workflowPath)}`] }
  }

  const content = readFileSync(workflowPath, 'utf8')
  const reasons: string[] = []

  // Check: NPM_TOKEN must NOT be referenced outside comments
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) continue
    if (/NPM_TOKEN/.test(line)) {
      reasons.push(`${basename(workflowPath)} line ${i + 1}: NPM_TOKEN reference outside comments`)
    }
  }

  return { ok: reasons.length === 0, reasons }
}

function checkWorkflow(
  workflowsDir: string,
  entryName: string,
): { ok: boolean; reasons: string[] } {
  const entryPath = join(workflowsDir, entryName)

  if (!existsSync(entryPath)) {
    return { ok: false, reasons: [`workflow file not found: ${entryName}`] }
  }

  // Collect all workflow files transitively referenced
  const allFiles = collectWorkflowFiles(workflowsDir, entryName)
  const reasons: string[] = []

  // Check each file for NPM_TOKEN violation
  for (const name of allFiles) {
    const filePath = join(workflowsDir, name)
    const fileCheck = checkWorkflowFile(filePath)
    reasons.push(...fileCheck.reasons)
  }

  // Check 2: id-token: write must be present (uncommented) in at least one file
  let hasIdToken = false
  for (const name of allFiles) {
    const filePath = join(workflowsDir, name)
    if (!existsSync(filePath)) continue
    const content = readFileSync(filePath, 'utf8')
    const idTokenLines = content
      .split('\n')
      .filter((l) => /id-token:\s*write/.test(l))
      .filter((l) => !l.trim().startsWith('#'))
    if (idTokenLines.length > 0) {
      hasIdToken = true
      break
    }
  }

  if (!hasIdToken) {
    reasons.push(`missing 'id-token: write' permission (required for OIDC) in workflow chain`)
  }

  return { ok: reasons.length === 0, reasons }
}

function main(): void {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'repo-root': { type: 'string', default: DEFAULT_REPO_ROOT },
      workflow: { type: 'string', default: 'release.yml' },
    },
  })

  const repoRoot = resolve(values['repo-root'] ?? DEFAULT_REPO_ROOT)
  const workflowName = values.workflow ?? 'release.yml'
  const workflowsDir = join(repoRoot, '.github', 'workflows')

  let packages: ReturnType<typeof discoverPackages>
  try {
    packages = discoverPackages(repoRoot)
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.error(`could not discover packages: ${(e as Error).message}`)
    process.exit(2)
  }

  if (packages.length === 0) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.log('no workspace packages to audit')
    process.exit(0)
  }

  const workflowCheck = checkWorkflow(workflowsDir, workflowName)

  // The workflow check is repo-wide; report it once, then mark every package
  // as OK or FAIL based on the workflow result.
  const findings: AuditFinding[] = packages.map((p) => ({
    package: p.name,
    status: workflowCheck.ok ? 'OK' : 'FAIL',
    reasons: workflowCheck.reasons,
  }))

  for (const f of findings) {
    if (f.status === 'OK') {
      // biome-ignore lint/suspicious/noConsole: CLI script
      console.log(`${f.package}  OK`)
    } else {
      // biome-ignore lint/suspicious/noConsole: CLI script
      console.error(`${f.package}  FAIL`)
      for (const r of f.reasons) {
        // biome-ignore lint/suspicious/noConsole: CLI script
        console.error(`  - ${r}`)
      }
    }
  }

  if (findings.some((f) => f.status === 'FAIL')) {
    process.exit(1)
  }
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log(`\nAll ${packages.length} package(s) covered by OIDC-only workflow.`)
}

main()
