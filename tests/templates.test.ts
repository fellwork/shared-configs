import { expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { listTemplates, templatePath, templatesDir } from '../src/templates.ts'

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

test('templatePath rejects paths that escape templatesDir', () => {
  expect(() => templatePath('../foo')).toThrow(/escapes/)
})
