import { test, expect } from 'bun:test'
import AjvLib from 'ajv'
import { loadKind, listKinds } from '../src/kinds.ts'
import { manifestSchema } from '../src/manifest-schema.ts'

// biome-ignore lint/suspicious/noExplicitAny: CJS interop for Ajv default export
const Ajv = (AjvLib as any).default ?? AjvLib

test('manifestSchema is a valid Ajv schema and accepts every shipped manifest', () => {
  // biome-ignore lint/suspicious/noExplicitAny: ajv interop
  const ajv = new Ajv({ allErrors: true }) as any
  const validate = ajv.compile(manifestSchema)

  const failures: { kind: string; errors: unknown }[] = []
  for (const name of listKinds()) {
    const m = loadKind(name)
    if (!validate(m)) {
      failures.push({ kind: name, errors: validate.errors })
    }
  }
  expect(failures).toEqual([])
})

test('manifestSchema has $schema stripped', () => {
  // biome-ignore lint/suspicious/noExplicitAny: probing for absence of a key
  expect((manifestSchema as any).$schema).toBeUndefined()
})
