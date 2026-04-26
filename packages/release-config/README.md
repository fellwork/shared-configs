# @fellwork/release-config

Shared bumpp + changesets defaults for Fellwork projects.

## Install

```bash
bun add -D -E @fellwork/release-config
```

## Use with bumpp

```typescript
// bumpp.config.ts
import { bumppDefaults } from '@fellwork/release-config/bumpp'

export default {
  ...bumppDefaults,
  // overrides…
}
```

## Use with changesets

```javascript
// .changeset/config.json
{ "extends": "@fellwork/release-config/changesets" }
```

## License

MIT
