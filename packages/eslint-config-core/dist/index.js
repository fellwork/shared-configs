var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/rules/std-modified.ts
var rules = {
  "accessor-pairs": [
    "error",
    {
      enforceForClassMembers: true,
      setWithoutGet: true
    }
  ],
  "array-bracket-newline": "off",
  "array-bracket-spacing": "off",
  "array-callback-return": "error",
  "array-element-newline": "off",
  "arrow-parens": "off",
  "arrow-spacing": "off",
  "block-scoped-var": "error",
  "block-spacing": "off",
  "brace-style": "off",
  camelcase: "off",
  "comma-dangle": "off",
  "comma-spacing": "off",
  "comma-style": "off",
  complexity: ["off", 11],
  "computed-property-spacing": "off",
  "consistent-return": "off",
  "constructor-super": "error",
  curly: "off",
  "default-case-last": "error",
  "dot-location": "off",
  "dot-notation": [
    "error",
    {
      allowKeywords: true
    }
  ],
  "eol-last": "off",
  eqeqeq: ["error", "smart"],
  "func-call-spacing": "off",
  "function-call-argument-newline": "off",
  "function-paren-newline": "off",
  "generator-star": "off",
  "generator-star-spacing": "off",
  "implicit-arrow-linebreak": "off",
  indent: "off",
  "jsx-quotes": "off",
  "key-spacing": "off",
  "keyword-spacing": "off",
  "linebreak-style": "off",
  "lines-around-comment": "off",
  "lines-between-class-members": [
    "error",
    "always",
    {
      exceptAfterSingleLine: true
    }
  ],
  "max-len": "off",
  "multiline-ternary": "off",
  "new-cap": [
    "error",
    {
      capIsNew: false,
      newIsCap: true,
      properties: true
    }
  ],
  "new-parens": "off",
  "newline-per-chained-call": "off",
  "no-alert": "warn",
  "no-array-constructor": "error",
  "no-arrow-condition": "off",
  "no-async-promise-executor": "error",
  "no-caller": "error",
  "no-case-declarations": "error",
  "no-class-assign": "error",
  "no-comma-dangle": "off",
  "no-compare-neg-zero": "error",
  "no-cond-assign": ["error", "always"],
  "no-confusing-arrow": "off",
  "no-console": ["error", { allow: ["warn", "error"] }],
  "no-const-assign": "error",
  "no-constant-condition": "warn",
  "no-control-regex": "error",
  "no-debugger": "error",
  "no-delete-var": "error",
  "no-dupe-args": "error",
  "no-dupe-class-members": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-empty": [
    "error",
    {
      allowEmptyCatch: true
    }
  ],
  "no-empty-character-class": "error",
  "no-empty-pattern": "error",
  "no-eval": "error",
  "no-ex-assign": "error",
  "no-extend-native": "error",
  "no-extra-bind": "error",
  "no-extra-boolean-cast": "error",
  "no-extra-parens": "off",
  "no-extra-semi": "off",
  "no-fallthrough": "error",
  "no-floating-decimal": "off",
  "no-func-assign": "error",
  "no-global-assign": "error",
  "no-implied-eval": "error",
  "no-import-assign": "error",
  "no-invalid-regexp": "error",
  "no-irregular-whitespace": "error",
  "no-iterator": "error",
  "no-labels": [
    "error",
    {
      allowLoop: false,
      allowSwitch: false
    }
  ],
  "no-lone-blocks": "error",
  "no-loss-of-precision": "error",
  "no-misleading-character-class": "error",
  "no-mixed-operators": "off",
  "no-mixed-spaces-and-tabs": "off",
  "no-multi-spaces": "off",
  "no-multi-str": "error",
  "no-multiple-empty-lines": "off",
  "no-new": "error",
  "no-new-func": "error",
  "no-new-object": "error",
  "no-new-symbol": "error",
  "no-new-wrappers": "error",
  "no-obj-calls": "error",
  "no-octal": "error",
  "no-octal-escape": "error",
  "no-param-reassign": "off",
  "no-proto": "error",
  "no-prototype-builtins": "error",
  "no-redeclare": [
    "error",
    {
      builtinGlobals: false
    }
  ],
  "no-regex-spaces": "error",
  "no-reserved-keys": "off",
  "no-restricted-syntax": [
    "error",
    "DebuggerStatement",
    "LabeledStatement",
    "WithStatement"
  ],
  "no-return-assign": "off",
  "no-return-await": "off",
  "no-self-assign": [
    "error",
    {
      props: true
    }
  ],
  "no-self-compare": "error",
  "no-sequences": "error",
  "no-shadow-restricted-names": "error",
  "no-space-before-semi": "off",
  "no-sparse-arrays": "error",
  "no-tabs": "off",
  "no-template-curly-in-string": "error",
  "no-this-before-super": "error",
  "no-throw-literal": "error",
  "no-trailing-spaces": "off",
  "no-undef": "error",
  "no-undef-init": "error",
  "no-unexpected-multiline": "off",
  "no-unmodified-loop-condition": "error",
  "no-unneeded-ternary": [
    "error",
    {
      defaultAssignment: false
    }
  ],
  "no-unreachable": "error",
  "no-unreachable-loop": "error",
  "no-unsafe-finally": "error",
  "no-unsafe-negation": "error",
  "no-unused-expressions": [
    "error",
    {
      allowShortCircuit: true,
      allowTaggedTemplates: true,
      allowTernary: true
    }
  ],
  "no-unused-vars": "warn",
  "no-use-before-define": [
    "error",
    { classes: false, functions: false, variables: true }
  ],
  "no-useless-backreference": "error",
  "no-useless-call": "error",
  "no-useless-catch": "error",
  "no-useless-computed-key": "error",
  "no-useless-constructor": "error",
  "no-useless-escape": "off",
  "no-useless-rename": "error",
  "no-useless-return": "error",
  "no-var": "error",
  "no-void": "error",
  "no-whitespace-before-property": "off",
  "no-with": "error",
  "no-wrap-func": "off",
  "nonblock-statement-body-position": "off",
  "object-curly-newline": "off",
  "object-curly-spacing": "off",
  "object-property-newline": "off",
  "object-shorthand": [
    "error",
    "always",
    {
      avoidQuotes: true,
      ignoreConstructors: false
    }
  ],
  "one-var": [
    "error",
    {
      initialized: "never"
    }
  ],
  "one-var-declaration-per-line": "off",
  "operator-linebreak": "off",
  "padded-blocks": "off",
  "prefer-arrow-callback": [
    "error",
    {
      allowNamedFunctions: false,
      allowUnboundThis: true
    }
  ],
  "prefer-const": [
    "error",
    {
      destructuring: "any",
      ignoreReadBeforeAssign: true
    }
  ],
  "prefer-promise-reject-errors": "error",
  "prefer-regex-literals": [
    "error",
    {
      disallowRedundantWrapping: true
    }
  ],
  "prefer-rest-params": "error",
  "prefer-spread": "error",
  "prefer-template": "error",
  "quote-props": "off",
  quotes: "off",
  "require-await": "off",
  "rest-spread-spacing": "off",
  semi: "off",
  "semi-spacing": "off",
  "semi-style": "off",
  "sort-imports": [
    "error",
    {
      allowSeparatedGroups: false,
      ignoreCase: false,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ["none", "all", "multiple", "single"]
    }
  ],
  "sort-keys": "off",
  "space-after-function-name": "off",
  "space-after-keywords": "off",
  "space-before-blocks": "off",
  "space-before-function-paren": "off",
  "space-before-function-parentheses": "off",
  "space-before-keywords": "off",
  "space-in-brackets": "off",
  "space-in-parens": "off",
  "space-infix-ops": "off",
  "space-return-throw-case": "off",
  "space-unary-ops": "off",
  "space-unary-word-ops": "off",
  "spaced-comment": [
    "error",
    "always",
    {
      block: {
        balanced: true,
        exceptions: ["*"],
        markers: ["!"]
      },
      line: {
        exceptions: ["/", "#"],
        markers: ["/"]
      }
    }
  ],
  "switch-colon-spacing": "off",
  "symbol-description": "error",
  "template-curly-spacing": "off",
  "template-tag-spacing": "off",
  "unicode-bom": "off",
  "use-isnan": [
    "error",
    {
      enforceForIndexOf: true,
      enforceForSwitchCase: true
    }
  ],
  "valid-typeof": [
    "error",
    {
      requireStringLiterals: true
    }
  ],
  "vars-on-top": "error",
  "wrap-iife": "off",
  "wrap-regex": "off",
  "yield-star-spacing": "off",
  yoda: ["error", "never"]
};
var std_modified_default = rules;

// src/index.ts
require("@rushstack/eslint-patch/modern-module-resolution");
var config = {
  env: {
    browser: true,
    es2021: true,
    es6: true,
    node: true
  },
  extends: ["plugin:jsonc/recommended-with-jsonc", "plugin:yml/standard"],
  ignorePatterns: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  overrides: [
    {
      env: {
        browser: true,
        node: true
      },
      files: ["*.js"],
      parser: "@babel/eslint-parser",
      parserOptions: {
        requireConfigFile: false
      }
    },
    {
      files: ["*.json", "*.json5"],
      parser: "jsonc-eslint-parser",
      rules: {
        "comma-dangle": ["error", "never"],
        "quote-props": ["error", "always"],
        quotes: ["error", "double"]
      }
    },
    {
      files: ["*.yaml", "*.yml"],
      parser: "yaml-eslint-parser"
    },
    {
      files: ["package.json"],
      parser: "jsonc-eslint-parser",
      rules: {
        "jsonc/sort-keys": [
          "error",
          {
            order: [
              "name",
              "version",
              "description",
              "keywords",
              "license",
              "repository",
              "funding",
              "author",
              "type",
              "files",
              "exports",
              "main",
              "module",
              "unpkg",
              "bin",
              "scripts",
              "husky",
              "lint-staged",
              "peerDependencies",
              "peerDependenciesMeta",
              "dependencies",
              "devDependencies",
              "eslintConfig",
              "prettier",
              "tsup"
            ],
            pathPattern: "^$"
          },
          {
            order: { type: "asc" },
            pathPattern: "^(?:dev|peer|optional|bundled)?[Dd]ependencies$"
          }
        ]
      }
    },
    {
      files: ["*.d.ts"],
      rules: {
        "import/no-duplicates": "off"
      }
    },
    {
      files: ["scripts/**/*.*"],
      rules: {
        "no-console": "off"
      }
    },
    {
      files: ["*.test.ts", "*.test.js", "*.spec.ts", "*.spec.js"],
      rules: {
        "no-unused-expressions": "off"
      }
    }
  ],
  plugins: ["html", "import", "n", "promise", "sort-keys", "unicorn"],
  rules: __spreadProps(__spreadValues({}, std_modified_default), {
    "eslint-comments/disable-enable-pair": "off",
    "import/export": "error",
    "import/first": "error",
    "import/no-absolute-path": "off",
    "import/no-duplicates": "error",
    "import/no-mutable-exports": "error",
    "import/no-named-as-default-member": "off",
    "import/no-named-default": "error",
    "import/no-unresolved": "off",
    "import/no-webpack-loader-syntax": "error",
    "import/order": "error",
    "n/handle-callback-err": ["error", "^(err|error)$"],
    "n/no-callback-literal": "error",
    "n/no-deprecated-api": "error",
    "n/no-exports-assign": "error",
    "n/no-new-require": "error",
    "n/no-path-concat": "error",
    "n/process-exit-as-throw": "error",
    "promise/param-names": "error",
    "sort-keys/sort-keys-fix": "warn",
    "unicorn/error-message": "error",
    "unicorn/escape-case": "error",
    "unicorn/no-array-instanceof": "error",
    "unicorn/no-new-buffer": "error",
    "unicorn/no-unsafe-regex": "off",
    "unicorn/number-literal-case": "error",
    "unicorn/prefer-exponentiation-operator": "error",
    "unicorn/prefer-includes": "error",
    "unicorn/prefer-starts-ends-with": "error",
    "unicorn/prefer-text-content": "error",
    "unicorn/prefer-type-error": "error",
    "unicorn/throw-new-error": "error"
  }),
  settings: {
    "import/resolver": {
      node: { extensions: [".js", ".mjs", ".ts", ".d.ts"] }
    }
  }
};
module.exports = config;
