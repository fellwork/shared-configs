import { afterAll, describe, expect, test } from 'bun:test'
import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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
    return {
      code: err.status,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    }
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
    mkdirSync(join(repo, '.github', 'workflows'), { recursive: true })

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
