---
'@fellwork/shared-configs': major
---

Publish `@fellwork/shared-configs@1.0.0` as an umbrella npm package.

- Public API: `loadKind`, `listKinds`, `kindsDir`, `templatePath`, `listTemplates`, `templatesDir`, `manifestSchema`, `manifestSchemaPath`, `KindManifest`
- Schema additions: optional `target`, `context`, `hooks`, `packagePaths` fields on every kind manifest
- Adjacent `*.tmpl.types.ts` files declare each template's render context type
- Consumed by `@fellwork/foreman` (Plan B)
