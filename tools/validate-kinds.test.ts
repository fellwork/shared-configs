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
