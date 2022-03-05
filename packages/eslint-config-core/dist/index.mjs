const rules = {
  curly: "off",
  "lines-around-comment": "off",
  "max-len": "off",
  "no-confusing-arrow": "off",
  "no-mixed-operators": "off",
  "no-tabs": "off",
  "no-unexpected-multiline": "off",
  quotes: "off",
  "array-bracket-newline": "off",
  "array-bracket-spacing": "off",
  "array-element-newline": "off",
  "arrow-parens": "off",
  "function-call-argument-newline": "off",
  "function-paren-newline": "off",
  "generator-star": "off",
  "generator-star-spacing": "off",
  "implicit-arrow-linebreak": "off",
  "jsx-quotes": "off",
  "key-spacing": "off",
  "keyword-spacing": "off",
  "linebreak-style": "off",
  "multiline-ternary": "off",
  "newline-per-chained-call": "off",
  "new-parens": "off",
  "no-arrow-condition": "off",
  "no-comma-dangle": "off",
  "no-extra-parens": "off",
  "no-extra-semi": "off",
  "no-floating-decimal": "off",
  "no-mixed-spaces-and-tabs": "off",
  "no-multi-spaces": "off",
  "no-multiple-empty-lines": "off",
  "no-reserved-keys": "off",
  "no-space-before-semi": "off",
  "no-trailing-spaces": "off",
  "no-whitespace-before-property": "off",
  "no-wrap-func": "off",
  "nonblock-statement-body-position": "off",
  "object-curly-newline": "off",
  "object-curly-spacing": "off",
  "object-property-newline": "off",
  "one-var-declaration-per-line": "off",
  "operator-linebreak": "off",
  "padded-blocks": "off",
  "quote-props": "off",
  "rest-spread-spacing": "off",
  semi: "off",
  "semi-spacing": "off",
  "semi-style": "off",
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
  "switch-colon-spacing": "off",
  "template-curly-spacing": "off",
  "template-tag-spacing": "off",
  "unicode-bom": "off",
  "wrap-iife": "off",
  "wrap-regex": "off",
  "yield-star-spacing": "off",
  "no-unused-vars": "warn",
  camelcase: "off",
  "no-cond-assign": ["error", "always"],
  "block-scoped-var": "error",
  "consistent-return": "off",
  complexity: ["off", 11],
  "no-alert": "warn",
  "no-case-declarations": "error",
  "no-multi-str": "error",
  "no-with": "error",
  "no-void": "error",
  "no-useless-escape": "off",
  "vars-on-top": "error",
  "require-await": "off",
  "no-return-assign": "off",
  "no-var": "error",
  "object-shorthand": [
    "error",
    "always",
    {
      ignoreConstructors: false,
      avoidQuotes: true
    }
  ],
  "accessor-pairs": [
    "error",
    {
      setWithoutGet: true,
      enforceForClassMembers: true
    }
  ],
  "array-callback-return": "error",
  "arrow-spacing": "off",
  "block-spacing": "off",
  "brace-style": "off",
  "comma-dangle": "off",
  "comma-spacing": "off",
  "comma-style": "off",
  "computed-property-spacing": "off",
  "constructor-super": "error",
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
  indent: "off",
  "lines-between-class-members": [
    "error",
    "always",
    {
      exceptAfterSingleLine: true
    }
  ],
  "new-cap": [
    "error",
    {
      newIsCap: true,
      capIsNew: false,
      properties: true
    }
  ],
  "no-array-constructor": "error",
  "no-async-promise-executor": "error",
  "no-caller": "error",
  "no-class-assign": "error",
  "no-compare-neg-zero": "error",
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
  "no-useless-backreference": "error",
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
  "no-fallthrough": "error",
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
  "no-prototype-builtins": "error",
  "no-useless-catch": "error",
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
  "no-redeclare": [
    "error",
    {
      builtinGlobals: false
    }
  ],
  "no-regex-spaces": "error",
  "no-restricted-syntax": [
    "error",
    "DebuggerStatement",
    "LabeledStatement",
    "WithStatement"
  ],
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
  "no-sparse-arrays": "error",
  "no-template-curly-in-string": "error",
  "no-this-before-super": "error",
  "no-throw-literal": "error",
  "no-undef": "error",
  "no-undef-init": "error",
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
      allowTernary: true,
      allowTaggedTemplates: true
    }
  ],
  "no-use-before-define": [
    "error",
    { functions: false, classes: false, variables: true }
  ],
  "no-useless-call": "error",
  "no-useless-computed-key": "error",
  "no-useless-constructor": "error",
  "no-useless-rename": "error",
  "no-useless-return": "error",
  "one-var": [
    "error",
    {
      initialized: "never"
    }
  ],
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
  "prefer-rest-params": "error",
  "prefer-spread": "error",
  "prefer-template": "error",
  "prefer-promise-reject-errors": "error",
  "prefer-regex-literals": [
    "error",
    {
      disallowRedundantWrapping: true
    }
  ],
  "sort-imports": [
    "error",
    {
      ignoreCase: false,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
      allowSeparatedGroups: false
    }
  ],
  "sort-keys": ["error", "asc", { natural: true, minKeys: 2 }],
  "spaced-comment": [
    "error",
    "always",
    {
      line: {
        markers: ["/"],
        exceptions: ["/", "#"]
      },
      block: {
        markers: ["!"],
        exceptions: ["*"],
        balanced: true
      }
    }
  ],
  "symbol-description": "error",
  "use-isnan": [
    "error",
    {
      enforceForSwitchCase: true,
      enforceForIndexOf: true
    }
  ],
  "valid-typeof": [
    "error",
    {
      requireStringLiterals: true
    }
  ],
  yoda: ["error", "never"]
};

var index = {
  env: {
    es6: true,
    es2021: true,
    browser: true,
    node: true
  },
  extends: ["plugin:jsonc/recommended-with-jsonc", "plugin:yml/standard"],
  plugins: ["html", "import", "n", "promise", "unicorn"],
  settings: {
    "import/resolver": {
      node: { extensions: [".js", ".mjs", ".ts", ".d.ts"] }
    }
  },
  overrides: [
    {
      files: ["*.js"],
      parser: "@babel/eslint-parser",
      parserOptions: {
        requireConfigFile: false
      },
      env: {
        browser: true,
        node: true
      }
    },
    {
      files: ["*.json", "*.json5"],
      parser: "jsonc-eslint-parser",
      rules: {
        quotes: ["error", "double"],
        "quote-props": ["error", "always"],
        "comma-dangle": ["error", "never"]
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
            pathPattern: "^$",
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
              "prettier"
            ]
          },
          {
            pathPattern: "^(?:dev|peer|optional|bundled)?[Dd]ependencies$",
            order: { type: "asc" }
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
  rules: {
    ...rules,
    "import/export": "error",
    "import/first": "error",
    "import/no-duplicates": "error",
    "import/no-named-default": "error",
    "import/no-webpack-loader-syntax": "error",
    "import/order": "error",
    "import/no-mutable-exports": "error",
    "import/no-unresolved": "off",
    "import/no-absolute-path": "off",
    "import/no-named-as-default-member": "off",
    "n/handle-callback-err": ["error", "^(err|error)$"],
    "n/no-callback-literal": "error",
    "n/no-deprecated-api": "error",
    "n/no-exports-assign": "error",
    "n/no-new-require": "error",
    "n/no-path-concat": "error",
    "n/process-exit-as-throw": "error",
    "promise/param-names": "error",
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
    "unicorn/throw-new-error": "error",
    "eslint-comments/disable-enable-pair": "off"
  }
};

export { index as default };