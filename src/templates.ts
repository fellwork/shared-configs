import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative as relativePath, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Absolute path to the templates/ directory shipped with this package.
 */
export const templatesDir: string = resolve(__dirname, '..', 'templates')

/**
 * Resolve a template's absolute path. Accepts the same relative form a kind
 * manifest declares (e.g. `'gitignore/node'`, `'README.md.tmpl'`).
 *
 * Throws if the template does not exist.
 */
export function templatePath(relative: string): string {
  const path = resolve(templatesDir, relative)
  // Defensive: refuse paths that escape templatesDir.
  const rel = relativePath(templatesDir, path)
  if (rel.startsWith('..') || rel.includes(`..${sep}`)) {
    throw new Error(`Template path escapes templatesDir: ${relative}`)
  }
  if (!existsSync(path)) {
    throw new Error(`Template not found: ${relative} (looked in ${templatesDir})`)
  }
  return path
}

/**
 * List all template files (recursive). Returns paths relative to templatesDir.
 * Excludes `*.tmpl.types.ts` adjacent type files.
 */
export function listTemplates(): string[] {
  const out: string[] = []
  walk(templatesDir, '', out)
  return out.sort()
}

function walk(absDir: string, relDir: string, out: string[]): void {
  for (const entry of readdirSync(absDir)) {
    const abs = join(absDir, entry)
    const rel = relDir ? `${relDir}/${entry}` : entry
    if (statSync(abs).isDirectory()) {
      walk(abs, rel, out)
    } else if (!entry.endsWith('.tmpl.types.ts')) {
      out.push(rel)
    }
  }
}
