/**
 * discoverPackages — list workspace packages from a repo's package.json.
 *
 * Library helper; not a CLI. Imported by tools that need to enumerate
 * the packages in a repo's `workspaces` field. Skips private packages
 * and packages without a `name`.
 *
 * Per tools-roadmap spec §5.2 (Item 3).
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

export interface DiscoveredPackage {
  name: string
  version: string
  path: string
  isPrivate: boolean
}

interface RootPackageManifest {
  workspaces?: string[] | { packages?: string[] }
}

interface WorkspacePackageManifest {
  name?: string
  version?: string
  private?: boolean
}

function readJson<T>(path: string): T {
  const raw = readFileSync(path, 'utf8')
  return JSON.parse(raw) as T
}

function expandWorkspaceGlob(repoRoot: string, glob: string): string[] {
  // Only support `<dir>/*` and bare `<dir>` for now (covers all Fellwork repos).
  // If the glob ends with /*, list direct subdirectories.
  // Otherwise treat as a literal directory path.
  if (glob.endsWith('/*')) {
    const baseDir = join(repoRoot, glob.slice(0, -2))
    if (!existsSync(baseDir)) return []
    return readdirSync(baseDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => join(baseDir, e.name))
      .sort()
  }
  const literal = join(repoRoot, glob)
  if (existsSync(literal) && statSync(literal).isDirectory()) {
    return [literal]
  }
  return []
}

function readWorkspacesField(rootManifest: RootPackageManifest): string[] {
  const ws = rootManifest.workspaces
  if (!ws) return []
  if (Array.isArray(ws)) return ws
  return ws.packages ?? []
}

export function discoverPackages(repoRoot: string): DiscoveredPackage[] {
  const root = resolve(repoRoot)
  const rootPkgPath = join(root, 'package.json')
  if (!existsSync(rootPkgPath)) {
    throw new Error(`No package.json found at ${rootPkgPath}`)
  }
  const rootPkg = readJson<RootPackageManifest>(rootPkgPath)
  const globs = readWorkspacesField(rootPkg)
  if (globs.length === 0) return []

  const result: DiscoveredPackage[] = []
  for (const glob of globs) {
    const dirs = expandWorkspaceGlob(root, glob)
    for (const dir of dirs) {
      const pkgPath = join(dir, 'package.json')
      if (!existsSync(pkgPath)) continue
      let manifest: WorkspacePackageManifest
      try {
        manifest = readJson<WorkspacePackageManifest>(pkgPath)
      } catch {
        continue
      }
      if (!manifest.name) continue
      if (manifest.private === true) continue
      result.push({
        name: manifest.name,
        version: manifest.version ?? '',
        path: dir,
        isPrivate: false,
      })
    }
  }
  return result
}
