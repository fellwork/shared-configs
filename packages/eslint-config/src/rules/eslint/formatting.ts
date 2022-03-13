export const formatting = {
  rules: {
    'array-bracket-newline': ['warn', 'consistent'],
    'array-bracket-spacing': ['warn', 'never'],
    'array-element-newline': ['warn', 'consistent'],
    'arrow-parens': ['warn', 'as-needed'],
    'arrow-spacing': [
      'warn',
      {
        after: true,
        before: true,
      },
    ],
    'block-spacing': ['warn', 'always'],
    'brace-style': [
      'warn',
      'stroustrup',
      {
        allowSingleLine: false,
      },
    ],
    'comma-dangle': [
      'warn',
      {
        arrays: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
        imports: 'always-multiline',
        objects: 'always-multiline',
      },
    ],
    'comma-spacing': [
      'warn',
      {
        after: true,
        before: false,
      },
    ],
    'comma-style': ['warn', 'last'],
    'computed-property-spacing': ['warn', 'never'],
    'dot-location': ['warn', 'property'],
    'eol-last': ['warn', 'always'],
    'func-call-spacing': ['warn', 'never'],
    'function-call-argument-newline': ['warn', 'consistent'],
    'function-paren-newline': ['warn', 'consistent'],
    'generator-star-spacing': [
      'warn',
      {
        after: false,
        before: true,
      },
    ],
    'implicit-arrow-linebreak': ['warn', 'beside'],
    indent: [
      'warn',
      2,
      {
        SwitchCase: 1,
      },
    ],
    'jsx-quotes': ['warn', 'prefer-double'],
    'key-spacing': [
      'warn',
      {
        afterColon: true,
        beforeColon: false,
        mode: 'strict',
      },
    ],
    'keyword-spacing': [
      'warn',
      {
        after: true,
        before: true,
      },
    ],
    'line-comment-position': [
      'error',
      {
        ignorePattern: '^ == .+',
        position: 'above',
      },
    ],
    'linebreak-style': ['warn', 'unix'],
    'lines-around-comment': [
      'warn',
      {
        afterBlockComment: false,
        afterLineComment: false,
        allowArrayEnd: false,
        allowArrayStart: false,
        allowBlockEnd: false,
        allowBlockStart: false,
        allowClassEnd: false,
        allowClassStart: false,
        allowObjectEnd: false,
        allowObjectStart: false,
        beforeBlockComment: true,
        beforeLineComment: false,
      },
    ],
    'lines-between-class-members': [
      'warn',
      'always',
      {
        exceptAfterSingleLine: true,
      },
    ],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreRegExpLiterals: true,
        ignoreUrls: true,
        tabWidth: 2,
      },
    ],
    'max-statements-per-line': [
      'error',
      {
        max: 1,
      },
    ],
    'multiline-ternary': ['warn', 'always-multiline'],
    'new-parens': 'warn',
    'newline-per-chained-call': [
      'off',
      {
        ignoreChainWithDepth: 3,
      },
    ],
    'no-extra-parens': [
      'warn',
      'all',
      {
        enforceForArrowConditionals: false,
        ignoreJSX: 'all',
        nestedBinaryExpressions: false,
      },
    ],
    'no-mixed-spaces-and-tabs': 'error',
    'no-multi-spaces': 'warn',
    'no-multiple-empty-lines': [
      'warn',
      {
        max: 1,
        maxBOF: 0,
        maxEOF: 0,
      },
    ],
    'no-tabs': 'error',
    'no-trailing-spaces': 'warn',
    'no-whitespace-before-property': 'warn',
    'nonblock-statement-body-position': ['warn', 'below'],
    'object-curly-newline': [
      'warn',
      {
        ExportDeclaration: { multiline: true },
        ImportDeclaration: { multiline: true },
      },
    ],
    'object-curly-spacing': [
      'warn',
      'always',
      {
        arraysInObjects: true,
        objectsInObjects: true,
      },
    ],
    'object-property-newline': [
      'warn',
      {
        allowAllPropertiesOnSameLine: true,
      },
    ],
    'operator-linebreak': [
      'warn',
      'before',
      {
        overrides: {
          '!=': 'none',
          '+=': 'none',
          '<=': 'none',
          '=': 'none',
          '==': 'none',
          '===': 'none',
          '>=': 'none',
        },
      },
    ],
    'padded-blocks': ['warn', 'never'],
    'padding-line-between-statements': 'off',
    quotes: [
      'warn',
      'single',
      {
        allowTemplateLiterals: true,
        avoidEscape: true,
      },
    ],
    'rest-spread-spacing': ['warn', 'never'],
    semi: ['warn', 'never'],
    'semi-spacing': [
      'warn',
      {
        after: true,
        before: false,
      },
    ],
    'semi-style': ['warn', 'last'],
    'space-before-blocks': ['warn', 'always'],
    'space-before-function-paren': [
      'warn',
      {
        anonymous: 'always',
        asyncArrow: 'always',
        named: 'never',
      },
    ],
    'space-in-parens': ['warn', 'never'],
    'space-infix-ops': [
      'warn',
      {
        int32Hint: false,
      },
    ],
    'space-unary-ops': [
      'warn',
      {
        nonwords: false,
        words: true,
      },
    ],
    'switch-colon-spacing': [
      'warn',
      {
        after: true,
        before: false,
      },
    ],
    'template-curly-spacing': ['warn', 'never'],
    'template-tag-spacing': ['warn', 'never'],
    'unicode-bom': ['warn', 'never'],
    'wrap-iife': ['warn', 'outside'],
    'wrap-regex': 'warn',
    'yield-star-spacing': [
      'warn',
      {
        after: false,
        before: true,
      },
    ],
  },
}
