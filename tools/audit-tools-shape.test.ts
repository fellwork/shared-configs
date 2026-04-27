import { afterAll, describe, expect, test } from 'bun:test'
import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUDITOR = resolve(__dirname, 'audit-tools-shape.ts')

const tempDirs: string[] = []

afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true })
})

function makeFakeToolsDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'audit-tools-shape-'))
  tempDirs.push(d)
  mkdirSync(join(d, 'tools'), { recursive: true })
  return d
}

interface RunResult {
  code: number
  stdout: string
  stderr: string
}

function runAuditor(toolsRoot: string): RunResult {
  try {
    const stdout = execSync(`bun run "${AUDITOR}" --root "${toolsRoot}"`, {
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

const COMPLIANT_TOOL = `#!/usr/bin/env bun
/**
 * Exit codes:
 *   0 - success
 *   1 - failure
 *   2 - bad input
 */
import { parseArgs } from 'node:util'

function main(): void {
  const { values } = parseArgs({ args: process.argv.slice(2), options: {} })
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log('hello', values)
}

main()
`

const COMPLIANT_TEST = `import { test, expect } from 'bun:test'

test('hello', () => {
  expect(1).toBe(1)
})
`

describe('audit-tools-shape', () => {
  test('passes for a compliant tool', () => {
    const root = makeFakeToolsDir()
    writeFileSync(join(root, 'tools', 'demo.ts'), COMPLIANT_TOOL)
    writeFileSync(join(root, 'tools', 'demo.test.ts'), COMPLIANT_TEST)
    const result = runAuditor(root)
    expect(result.code).toBe(0)
    expect(result.stdout).toContain('demo.ts')
    expect(result.stdout).toContain('OK')
  })

  test('flags a tool missing a shebang', () => {
    const root = makeFakeToolsDir()
    writeFileSync(
      join(root, 'tools', 'demo.ts'),
      COMPLIANT_TOOL.replace('#!/usr/bin/env bun\n', ''),
    )
    writeFileSync(join(root, 'tools', 'demo.test.ts'), COMPLIANT_TEST)
    const result = runAuditor(root)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('shebang')
  })

  test('flags a tool missing a colocated test', () => {
    const root = makeFakeToolsDir()
    writeFileSync(join(root, 'tools', 'demo.ts'), COMPLIANT_TOOL)
    const result = runAuditor(root)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('demo.test.ts')
  })

  test('flags a console call without biome-ignore', () => {
    const root = makeFakeToolsDir()
    const tool = COMPLIANT_TOOL.replace(
      "// biome-ignore lint/suspicious/noConsole: CLI script\n  console.log('hello', values)",
      "console.log('hello', values)",
    )
    writeFileSync(join(root, 'tools', 'demo.ts'), tool)
    writeFileSync(join(root, 'tools', 'demo.test.ts'), COMPLIANT_TEST)
    const result = runAuditor(root)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('biome-ignore')
  })

  test('flags a tool not using parseArgs', () => {
    const root = makeFakeToolsDir()
    const tool = COMPLIANT_TOOL.replace("import { parseArgs } from 'node:util'", '')
    writeFileSync(join(root, 'tools', 'demo.ts'), tool)
    writeFileSync(join(root, 'tools', 'demo.test.ts'), COMPLIANT_TEST)
    const result = runAuditor(root)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('parseArgs')
  })

  test('flags a tool missing exit-code doc comment', () => {
    const root = makeFakeToolsDir()
    const tool = COMPLIANT_TOOL.replace(/\/\*\*[\s\S]*?\*\/\n/, '')
    writeFileSync(join(root, 'tools', 'demo.ts'), tool)
    writeFileSync(join(root, 'tools', 'demo.test.ts'), COMPLIANT_TEST)
    const result = runAuditor(root)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('exit codes')
  })

  test('skips lib/ subdirectory', () => {
    const root = makeFakeToolsDir()
    mkdirSync(join(root, 'tools', 'lib'))
    writeFileSync(join(root, 'tools', 'lib', 'helper.ts'), 'export function helper(): void {}\n')
    const result = runAuditor(root)
    expect(result.code).toBe(0) // empty tools/ but lib/ ignored
  })

  test('skips test files themselves', () => {
    const root = makeFakeToolsDir()
    writeFileSync(join(root, 'tools', 'demo.ts'), COMPLIANT_TOOL)
    writeFileSync(join(root, 'tools', 'demo.test.ts'), COMPLIANT_TEST)
    const result = runAuditor(root)
    // Should pass: demo.test.ts is not audited as a tool, only as a colocated test for demo.ts
    expect(result.code).toBe(0)
  })
})
