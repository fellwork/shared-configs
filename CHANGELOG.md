# @fellwork/shared-configs

## 1.0.0

### Major Changes

- [#5](https://github.com/fellwork/shared-configs/pull/5) [`013790e`](https://github.com/fellwork/shared-configs/commit/013790e8b402250687d5b353b6e04405c913483d) Thanks [@srmcguirt](https://github.com/srmcguirt)! - Publish `@fellwork/shared-configs@1.0.0` as an umbrella npm package.

  - Public API: `loadKind`, `listKinds`, `kindsDir`, `templatePath`, `listTemplates`, `templatesDir`, `manifestSchema`, `manifestSchemaPath`, `KindManifest`
  - Schema additions: optional `target`, `context`, `hooks`, `packagePaths` fields on every kind manifest
  - Adjacent `*.tmpl.types.ts` files declare each template's render context type
  - Consumed by `@fellwork/foreman` (Plan B)
