import { describe, expect, test } from 'bun:test'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import AjvLib from 'ajv'
import * as YAML from 'yaml'

// biome-ignore lint/suspicious/noExplicitAny: CJS interop for Ajv default export
const Ajv = (AjvLib as any).default ?? AjvLib

const __dirname = dirname(fileURLToPath(import.meta.url))
const VALIDATOR = resolve(__dirname, 'validate-kinds.ts')

describe('validate-kinds', () => {
  test('all kinds/*.yaml validate against the schema', () => {
    const stdout = execSync(`bun run "${VALIDATOR}"`, { encoding: 'utf8' })
    expect(stdout).toContain('All')
    expect(stdout).toContain('valid')
  })
})

test('schema accepts all v1-addition fields', () => {
  const schema = JSON.parse(
    readFileSync(join(__dirname, '..', 'kinds', '_schema.json'), 'utf8'),
  )
  delete schema.$schema
  // biome-ignore lint/suspicious/noExplicitAny: ajv interop
  const ajv = new Ajv({ allErrors: true }) as any
  const validate = ajv.compile(schema)
  const fixture = YAML.parse(
    readFileSync(
      join(__dirname, 'fixtures', 'kind-with-v1-fields.yaml'),
      'utf8',
    ),
  )
  const ok = validate(fixture)
  if (!ok) {
    // biome-ignore lint/suspicious/noConsole: test diagnostic
    console.error(validate.errors)
  }
  expect(ok).toBe(true)
})
