import { resolve } from 'node:path'
// import { PackageJson as Pkg } from 'type-fest'

export function getPkg(root?: string) {
  if (!root) root = process.cwd()

  const path = resolve(root, 'package.json')
  //const pkg: Pkg = import(path)
  return path
  //return pkg
}
