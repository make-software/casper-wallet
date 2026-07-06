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
      // --- Ported 1:1 from the legacy .eslintrc (eslint-config-react-app base) ---
      'react/jsx-filename-extension': [
        1,
        { extensions: ['.js', '.jsx', '.ts', '.tsx'] }
      ],
      'no-unused-vars': 'off',
      // `caughtErrors: 'none'` preserves the legacy @typescript-eslint v5 default
      // (unused `catch` bindings were not flagged) — parity with the old baseline,
      // keeps the rule strict for genuinely unused variables/arguments.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'after-used', caughtErrors: 'none' }
      ],
      'jsx-a11y/no-autofocus': 'off',
      'import/no-cycle': [1, { maxDepth: 10, ignoreExternal: true }],
      'import/no-named-as-default': 0,
      'import/export': 1,

      // --- Restored from the legacy eslint-config-react-app baseline ---
      // react-app enforced these error/warn rules outside of any recommended
      // preset, so dropping the config silently un-enforced them (they moved
      // from `on` to `absent`, not `off`, so they never showed up as "net-new
      // disabled"). All six pass with zero violations against current src, so
      // re-adding them restores parity with no code churn. They are genuine
      // bug/security catchers, not style (which prettier owns) — kept at
      // `error` so a future regression fails CI rather than only warns.
      'array-callback-return': 'error',
      'no-restricted-globals': ['error', ...confusingBrowserGlobals],
      'no-script-url': 'error',
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-throw-literal': 'error',

      // --- Deferred (DEP-12): rules newly introduced by the ESLint 9 /
      // typescript-eslint 8 / react-hooks 7 / eslint-plugin-react recommended
      // presets that the legacy eslint-config-react-app baseline never enforced.
      // Disabled to keep this ticket a pure config migration (zero src churn).
      // TODO(WALLET-1340 follow-up): adopt in a dedicated "eslint-strict" ticket —
      // re-enable each rule and fix the flagged code. Hit counts as of migration:
      // typescript-eslint recommended:
      '@typescript-eslint/no-explicit-any': 'off', // 47
      '@typescript-eslint/no-unused-expressions': 'off', // 14
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off', // 14
      '@typescript-eslint/ban-ts-comment': 'off', // 12
      '@typescript-eslint/no-empty-object-type': 'off', // 3
      '@typescript-eslint/no-duplicate-enum-values': 'off', // 2
      // react-hooks 7 (new vs v4):
      'react-hooks/set-state-in-effect': 'off', // 35
      'react-hooks/refs': 'off', // 9
      'react-hooks/preserve-manual-memoization': 'off', // 8
      'react-hooks/incompatible-library': 'off', // 1
      // eslint-plugin-react recommended:
      'react/display-name': 'off', // 18
      'react/no-children-prop': 'off', // 7
      'react/no-unescaped-entities': 'off', // 3
      // core eslint:recommended (react-app enforced only a curated subset):
      'no-async-promise-executor': 'off', // 2 — real smell, prioritise re-enabling
      'no-empty': 'off', // 3
      'no-useless-catch': 'off', // 2
      'no-case-declarations': 'off' // 1
    }
  }
);
