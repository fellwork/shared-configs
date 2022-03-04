'use strict';

var core = require('@fellwork/eslint-config-core');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var core__default = /*#__PURE__*/_interopDefaultLegacy(core);

var index = {
  extends: [
    "@fellwork/eslint-config-core",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  overrides: core__default["default"].overrides,
  rules: {
    "@typescript-eslint/brace-style": "off",
    "@typescript-eslint/comma-dangle": "off",
    "@typescript-eslint/comma-spacing": "off",
    "@typescript-eslint/func-call-spacing": "off",
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/keyword-spacing": "off",
    "@typescript-eslint/member-delimiter-style": "off",
    "@typescript-eslint/no-extra-parens": "off",
    "@typescript-eslint/no-extra-semi": "off",
    "@typescript-eslint/object-curly-spacing": "off",
    "@typescript-eslint/semi": "off",
    "@typescript-eslint/space-before-blocks": "off",
    "@typescript-eslint/space-before-function-paren": "off",
    "@typescript-eslint/space-infix-ops": "off",
    "@typescript-eslint/type-annotation-spacing": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-parameter-properties": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/no-namespace": "off",
    "import/named": "off",
    "@typescript-eslint/ban-ts-comment": [
      "error",
      { "ts-ignore": "allow-with-description" }
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", disallowTypeAnnotations: false }
    ],
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
    "@typescript-eslint/prefer-ts-expect-error": "error",
    "no-useless-constructor": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "no-redeclare": "off",
    "@typescript-eslint/no-redeclare": "error",
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": [
      "error",
      { functions: false, classes: false, variables: true }
    ]
  }
};

module.exports = index;
//# sourceMappingURL=index.js.map
