import { afterAll, describe, expect, test } from 'bun:test'
import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUDITOR = resolve(__dirname, 'trust-audit.ts')

const tempDirs: string[] = []

afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true })
})

function makeRepo(): string {
  const d = mkdtempSync(join(tmpdir(), 'trust-audit-'))
  tempDirs.push(d)
  return d
}

function writePkg(repoRoot: string, relPath: string, content: object): void {
  const dir = join(repoRoot, relPath)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify(content, null, 2))
}

function writeWorkflow(repoRoot: string, name: string, content: string): void {
  const dir = join(repoRoot, '.github', 'workflows')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), content)
}

interface RunResult {
  code: number
  stdout: string
  stderr: string
}

function runAuditor(repoRoot: string, args: string[] = []): RunResult {
  const argList = [`--repo-root`, repoRoot, ...args].map((a) => `"${a}"`).join(' ')
  try {
    const stdout = execSync(`bun run "${AUDITOR}" ${argList}`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    })
    return { code: 0, stdout, stderr: '' }
  } catch (e) {
    const err = e as { status: number; stdout: Buffer; stderr: Buffer }
    return {
      code: err.status,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    }
  }
}

const OIDC_RELEASE_YML = `
name: Release
on: { push: { branches: [main] } }
jobs:
  release:
    permissions:
      contents: write
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bunx changeset publish
`

const TOKEN_RELEASE_YML = `
name: Release
on: { push: { branches: [main] } }
jobs:
  release:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bunx changeset publish
        env:
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
`

describe('trust-audit (workflow-side, Path B)', () => {
  test('passes when release.yml is OIDC-only', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/foo', { name: '@org/foo', version: '1.0.0' })
    writeWorkflow(repo, 'release.yml', OIDC_RELEASE_YML)

    const result = runAuditor(repo)
    expect(result.code).toBe(0)
    expect(result.stdout).toContain('OK')
  })

  test('fails when release.yml uses NPM_TOKEN', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/foo', { name: '@org/foo', version: '1.0.0' })
    writeWorkflow(repo, 'release.yml', TOKEN_RELEASE_YML)

    const result = runAuditor(repo)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('NPM_TOKEN')
  })

  test('fails when release.yml is missing id-token: write', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/foo', { name: '@org/foo', version: '1.0.0' })
    writeWorkflow(repo, 'release.yml', OIDC_RELEASE_YML.replace('id-token: write', ''))

    const result = runAuditor(repo)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('id-token')
  })

  test('fails when release.yml is missing entirely', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/foo', { name: '@org/foo', version: '1.0.0' })
    // No release.yml

    const result = runAuditor(repo)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('release.yml')
  })

  test('respects --workflow flag', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/foo', { name: '@org/foo', version: '1.0.0' })
    writeWorkflow(repo, 'publish.yml', OIDC_RELEASE_YML)

    const result = runAuditor(repo, ['--workflow', 'publish.yml'])
    expect(result.code).toBe(0)
  })

  test('exits 0 for repo with no workspace packages', () => {
    const repo = makeRepo()
    writeFileSync(join(repo, 'package.json'), JSON.stringify({ name: 'root' }))
    writeWorkflow(repo, 'release.yml', OIDC_RELEASE_YML)

    const result = runAuditor(repo)
    expect(result.code).toBe(0)
    expect(result.stdout).toContain('no')
  })
})
