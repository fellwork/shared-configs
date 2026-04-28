import { expect, test } from 'bun:test'
import { kindsDir, listKinds, loadKind } from '../src/kinds.ts'

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
