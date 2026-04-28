import { expect, test } from 'bun:test'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = resolve(__dirname, '..', 'templates')

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
