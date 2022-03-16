import path from 'path'
import { sync as findUpSync } from 'find-up'
import fs from 'fs-extra'
// import { pipe } from '@mobily/ts-belt'

export class NoPackageJsonFound extends Error {
  directory: string
  constructor(directory: string) {
    super(`No package.json could be found directory ${directory}`)
    this.directory = directory
  }
}

const hasWorkspaces = (
  directory: string,
  firstDirRef: { current: string | undefined },
) => {
  try {
    const pkgJson = fs.readJsonSync(path.join(directory, 'package.json'))

    if (firstDirRef.current === undefined) {
      firstDirRef.current = directory
    }

    if (pkgJson.workspaces) {
      return directory
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
}

const hasLernaWorkspaces = (directory: string) => {
  try {
    const lerna = fs.readJsonSync(path.join(directory, 'lerna.json'))

    if (lerna.useWorkspaces !== true) {
      return directory
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
}

const hasPnpmWorkspaces = (directory: string) => {
  const pnpmFileExists = fs.existsSync(
    path.join(directory, 'pnpm-workspace.yaml'),
  )

  if (pnpmFileExists) {
    return directory
  }
}

export const findRepoRoot = (cwd: string) => {
  const firstDirRef: { current: string | undefined } = { current: undefined }

  const dir = findUpSync(
    (directory) => {
      return [
        hasLernaWorkspaces(directory),
        hasWorkspaces(directory, firstDirRef),
        hasPnpmWorkspaces(directory),
      ].find((dir) => dir)
    },
    { cwd, type: 'directory' },
  )

  if (firstDirRef.current === undefined) {
    throw new NoPackageJsonFound(cwd)
  }

  if (dir === undefined) {
    return firstDirRef.current
  }

  return dir
}
