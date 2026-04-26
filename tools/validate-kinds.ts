#!/usr/bin/env bun
/**
 * validate-kinds — assert all kinds/*.yaml conform to kinds/_schema.json.
 *
 * Exits 0 if all manifests validate; exits 1 with the first error otherwise.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import AjvLib from 'ajv'
import * as YAML from 'yaml'

// Ajv 8 ships as CJS; under ESM/NodeNext the default may be double-wrapped.
// biome-ignore lint/suspicious/noExplicitAny: CJS interop for Ajv default export
const Ajv = (AjvLib as any).default ?? AjvLib

const __dirname = dirname(fileURLToPath(import.meta.url))
const KINDS_DIR = resolve(__dirname, '..', 'kinds')
const SCHEMA_PATH = join(KINDS_DIR, '_schema.json')

function main(): void {
  // biome-ignore lint/suspicious/noExplicitAny: Ajv constructor type lost after interop unwrap
  const ajv = new Ajv({ allErrors: true }) as any
  // Strip the $schema field so Ajv doesn't attempt to fetch the meta-schema URI
  const { $schema: _s, ...schema } = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')) as Record<
    string,
    unknown
  >
  const validate = ajv.compile(schema)

  const files = readdirSync(KINDS_DIR).filter((f) => f.endsWith('.yaml'))
  let failed = 0

  for (const f of files) {
    const path = join(KINDS_DIR, f)
    const expectedKind = f.replace(/\.yaml$/, '')
    const data = YAML.parse(readFileSync(path, 'utf8'))

    if (data.kind !== expectedKind) {
      // biome-ignore lint/suspicious/noConsole: CLI script
      console.error(`✗ ${f}: kind="${data.kind}" does not match filename`)
      failed++
      continue
    }

    if (!validate(data)) {
      // biome-ignore lint/suspicious/noConsole: CLI script
      console.error(`✗ ${f}: schema validation failed:`)
      for (const err of validate.errors ?? []) {
        // biome-ignore lint/suspicious/noConsole: CLI script
        console.error(`    ${err.instancePath} ${err.message}`)
      }
      failed++
      continue
    }

    // biome-ignore lint/suspicious/noConsole: CLI script
    console.log(`✓ ${f}`)
  }

  if (failed > 0) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.error(`\n${failed}/${files.length} manifest(s) failed`)
    process.exit(1)
  }
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log(`\nAll ${files.length} manifest(s) valid`)
}

main()
