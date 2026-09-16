import js from '@eslint/js';
import confusingBrowserGlobals from 'confusing-browser-globals';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['build', 'output', 'node_modules', 'dist', '**/*.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  reactHooks.configs.flat.recommended,
  prettierRecommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { typescript: { alwaysTryTypes: true } }
    },
    rules: {
      'react/jsx-filename-extension': [
        1,
        { extensions: ['.js', '.jsx', '.ts', '.tsx'] }
      ],
      'no-unused-vars': 'off',
      // `caughtErrors: 'none'` leaves unused `catch` bindings unflagged; the rule
      // stays strict for genuinely unused variables and arguments.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'after-used', caughtErrors: 'none' }
      ],
      'jsx-a11y/no-autofocus': 'off',
      'import/no-cycle': [1, { maxDepth: 10, ignoreExternal: true }],
      'import/no-named-as-default': 0,
      'import/export': 1,

      'array-callback-return': 'error',
      'no-restricted-globals': ['error', ...confusingBrowserGlobals],
      'no-script-url': 'error',
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-throw-literal': 'error',

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react/display-name': 'off',
      'react/no-children-prop': 'off',
      'react/no-unescaped-entities': 'off',
      'no-async-promise-executor': 'off',
      'no-empty': 'off',
      'no-useless-catch': 'off',
      'no-case-declarations': 'off'
    }
  },
  {
    // Playwright e2e suite: linted by IDEs only, since `npm run lint` targets
    // ./src. The fixture callback is named `use` and trips rules-of-hooks.
    files: ['e2e-tests/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'after-used', caughtErrors: 'none' }
      ]
    }
  }
);
