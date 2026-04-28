/**
 * TypeScript shape of a kind manifest, mirroring kinds/_schema.json.
 * Update both files together when the schema changes.
 */

export interface KindManifest {
  kind: string
  description: string
  extends?: string
  templates?: string[]
  workflows?: string[]
  packages?: {
    devDependencies?: string[]
    peerDependencies?: { name: string; version: string }[]
  }
  tsconfig?: {
    extends?: string[]
    include?: string[]
  }
  cargo?: Record<string, unknown>
  renovate?: { extends?: string }
  scripts?: Record<string, string>

  // v1 additions
  target?: ('repo' | 'package')[]
  context?: {
    required?: string[]
    optional?: string[]
  }
  hooks?: {
    postInit?: string[]
    postSync?: string[]
    timeout?: number
  }
  packagePaths?: string[]
}
