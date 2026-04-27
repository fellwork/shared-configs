import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as YAML from 'yaml'
import type { KindManifest } from './types.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Absolute path to the kinds/ directory shipped with this package.
 * Useful when consumers need to enumerate or stream raw YAML.
 */
export const kindsDir: string = resolve(__dirname, '..', 'kinds')

/**
 * List all available kind names (filenames in kinds/ minus `.yaml`).
 *
 * Excludes:
 *   - non-`.yaml` files (e.g., `_schema.json`)
 *   - YAML files whose name starts with `_` (reserved for private fragments
 *     like `_anchors.yaml` that may be added in the future)
 */
export function listKinds(): string[] {
  return readdirSync(kindsDir)
    .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
    .map((f) => f.replace(/\.yaml$/, ''))
    .sort()
}

/**
 * Load a kind manifest by name. Does NOT resolve `extends:` — that is the
 * consumer's responsibility (foreman handles it via deep-merge).
 *
 * Throws if the kind does not exist or the YAML fails to parse.
 */
export function loadKind(name: string): KindManifest {
  const path = join(kindsDir, `${name}.yaml`)
  if (!existsSync(path)) {
    throw new Error(`Kind manifest not found: ${name} (looked in ${kindsDir})`)
  }
  return YAML.parse(readFileSync(path, 'utf8')) as KindManifest
}
