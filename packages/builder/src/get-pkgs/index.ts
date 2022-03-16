/* eslint-disable no-console */
import path from 'path'
import fs from 'fs-extra'
import { sync as readYamlFileSync } from 'read-yaml-file'
import { G } from '@mobily/ts-belt'
import type { PackageJson } from 'type-fest'
import * as glob from 'globby'
import { findRepoRoot } from '../repo-root'

export type Tool = 'yarn' | 'pnpm' | 'lerna' | 'root'

export interface Package {
  packageJson: PackageJson
  dir: string
}

export interface Packages {
  tool: Tool
  packages: Package[]
  root: Package
}

export class PkgJsonMissingNameError extends Error {
  dirs: string[]
  constructor(dirs: string[]) {
    super(`No name found in package.json in directories ${dirs.join(', ')}`)
    this.dirs = dirs
  }
}

export const getPkgs = (dir: string): Packages => {
  const cwd = findRepoRoot(dir)
  const pkg = fs.readJsonSync(path.join(cwd, 'package.json'))

  let tool:
    | {
        type: Tool
        packageGlobs: string[]
      }
    | undefined

  if (pkg.workspaces) {
    if (G.isArray(pkg.workspaces)) {
      tool = {
        packageGlobs: pkg.workspaces,
        type: 'yarn',
      }
    } else if (pkg.workspaces.packages) {
      tool = {
        packageGlobs: pkg.workspaces.packages,
        type: 'yarn',
      }
    }
  } else {
    try {
      const manifest = readYamlFileSync<{ packages?: string[] }>(
        path.join(cwd, 'pnpm-workspace.yaml'),
      )

      if (manifest && manifest.packages) {
        tool = {
          packageGlobs: manifest.packages,
          type: 'pnpm',
        }
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }

    if (!tool) {
      try {
        const lerna = fs.readJsonSync(path.join(cwd, 'lerna.json'))
        if (lerna) {
          tool = {
            packageGlobs: lerna.packages || ['packages/*'],
            type: 'lerna',
          }
        }
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err
        }
      }
    }
  }
  if (!tool) {
    const root = {
      dir: cwd,
      packageJson: pkg,
    }
    if (!pkg.name) {
      throw new PkgJsonMissingNameError(['package.json'])
    }
    return {
      packages: [root],
      root,
      tool: 'root',
    }
  }

  const relDirs = glob.globbySync(tool.packageGlobs, {
    cwd,
    expandDirectories: false,
    ignore: ['**/node_modules'],
    onlyDirectories: true,
  })

  const dirs = relDirs.map((p: string) => path.resolve(cwd, p))

  const pkgJsonMissingName: string[] = []

  const results = dirs
    .sort()
    .map((dir: string) => {
      try {
        const pkgJson = fs.readJsonSync(path.join(dir, 'package.json'))
        if (!pkgJson.name) {
          pkgJsonMissingName.push(
            path.relative(cwd, path.join(dir, 'package.json')),
          )
        }
        return {
          dir,
          packageJson: pkgJson,
        }
      } catch (err: any) {
        if (err.code === 'ENOENT') return null
        throw err
      }
    })
    .filter((x) => x)

  if (pkgJsonMissingName.length !== 0) {
    pkgJsonMissingName.sort()
    throw new PkgJsonMissingNameError(pkgJsonMissingName)
  }

  return {
    packages: results as Package[],
    root: {
      dir: cwd,
      packageJson: pkg,
    },
    tool: tool.type,
  }
}
