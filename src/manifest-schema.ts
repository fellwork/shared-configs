import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Path to the kind-manifest JSON Schema. The schema itself is shipped in the
 * package files; consumers can read it directly or import the parsed object.
 */
export const manifestSchemaPath: string = resolve(__dirname, '..', 'kinds', '_schema.json')

/**
 * Parsed JSON Schema for kind manifests. Strips the `$schema` field so Ajv
 * does not attempt to fetch the meta-schema URI.
 */
export const manifestSchema: Record<string, unknown> = (() => {
  const raw = JSON.parse(readFileSync(manifestSchemaPath, 'utf8')) as Record<string, unknown>
  const { $schema: _s, ...rest } = raw
  return rest
})()
