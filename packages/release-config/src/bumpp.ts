import type { VersionBumpOptions } from 'bumpp'

export const bumppDefaults: Partial<VersionBumpOptions> = {
  commit: 'chore-release: v%s',
  tag: 'v%s',
  push: false,
  files: ['package.json', 'packages/*/package.json'],
}
