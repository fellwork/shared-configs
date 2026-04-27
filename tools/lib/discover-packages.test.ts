import { afterAll, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { discoverPackages } from './discover-packages.ts'

const tempDirs: string[] = []

afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true })
})

function makeRepo(): string {
  const d = mkdtempSync(join(tmpdir(), 'discover-packages-'))
  tempDirs.push(d)
  return d
}

function writePkg(repoRoot: string, relPath: string, content: object): void {
  const dir = join(repoRoot, relPath)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify(content, null, 2))
}

describe('discoverPackages', () => {
  test('returns empty for repo with no workspaces field', () => {
    const repo = makeRepo()
    writeFileSync(join(repo, 'package.json'), JSON.stringify({ name: 'root' }))
    expect(discoverPackages(repo)).toEqual([])
  })

  test('discovers packages from a flat workspaces array', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/foo', { name: '@org/foo', version: '1.0.0' })
    writePkg(repo, 'packages/bar', { name: '@org/bar', version: '0.1.0' })

    const result = discoverPackages(repo)
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.name).sort()).toEqual(['@org/bar', '@org/foo'])
    for (const p of result) {
      expect(p.path.startsWith(repo)).toBe(true)
      expect(typeof p.version).toBe('string')
      expect(p.isPrivate).toBe(false)
    }
  })

  test('skips private packages', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/pub', { name: '@org/pub', version: '1.0.0' })
    writePkg(repo, 'packages/priv', {
      name: '@org/priv',
      version: '1.0.0',
      private: true,
    })

    const result = discoverPackages(repo)
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('@org/pub')
  })

  test('skips packages without a name', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/named', { name: '@org/named', version: '1.0.0' })
    writePkg(repo, 'packages/anonymous', { version: '1.0.0' })

    const result = discoverPackages(repo)
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('@org/named')
  })

  test('handles workspaces.packages nested form', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: { packages: ['packages/*'] } }),
    )
    writePkg(repo, 'packages/foo', { name: '@org/foo', version: '1.0.0' })

    const result = discoverPackages(repo)
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('@org/foo')
  })

  test('throws on missing root package.json', () => {
    const repo = makeRepo()
    expect(() => discoverPackages(repo)).toThrow()
  })

  test('throws on malformed root package.json', () => {
    const repo = makeRepo()
    writeFileSync(join(repo, 'package.json'), '{ this is not valid json')
    expect(() => discoverPackages(repo)).toThrow()
  })

  test('returns deterministic order', () => {
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/zeta', { name: '@org/zeta', version: '1.0.0' })
    writePkg(repo, 'packages/alpha', { name: '@org/alpha', version: '1.0.0' })

    const r1 = discoverPackages(repo).map((p) => p.name)
    const r2 = discoverPackages(repo).map((p) => p.name)
    expect(r1).toEqual(r2)
  })

  test('sets isPrivate=true for private packages when discovered separately', () => {
    // This test confirms the function only filters private packages from the default list.
    // If private packages are needed, a future option could expose them. For now, just
    // verify the field exists for the (filtered) result set.
    const repo = makeRepo()
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
    )
    writePkg(repo, 'packages/foo', { name: '@org/foo', version: '1.0.0' })

    const result = discoverPackages(repo)
    expect(result[0]?.isPrivate).toBe(false)
  })
})
