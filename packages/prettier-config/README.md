# @fellwork/prettier-config

>Shareable Prettier configuration

## Installation

```bash
# npm
npm install prettier @fellwork/prettier-config --dev

#yarn
yarn add prettier @fellwork/prettier-config --dev

# pnpm
pnpm install prettier @fellwork/prettier-config --dev
```

## Use

### As a reference in `package.json`

```jsonc
// `package.json`
{
  //...
  "prettier": "@fellwork/prettier-config"
  //...
}
```

### With supported extensions

```jsonc
// `.prettierrc.json`
"@fellwork/prettier-config"
```

```javascript
// `prettier.config.js` or `.prettierrc.js`
module.exports = '@fellwork/prettier-config'
```
