module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(j|t)sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@lapo/asn1js|@noble/ciphers|@formatjs|intl-messageformat|casper-wallet-core|uuid)/)'
  ],
  // __CSP_NONCE__ is substituted by webpack's DefinePlugin, which never runs under
  // jest. Without this the free variable would throw ReferenceError in any test that
  // pulls in a module reading it; null matches both its declared type
  // (src/@types/custom.d.ts) and what every non-Chrome-production build gets.
  globals: {
    __CSP_NONCE__: null
  },
  coveragePathIgnorePatterns: ['/node_modules/'],
  testRegex: '(/tests?/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // `.claude/worktrees/` holds full checkouts of other branches, each with its
  // own node_modules; without this jest crawls and compiles all of them.
  modulePathIgnorePatterns: ['<rootDir>/e2e-tests', '<rootDir>/.claude'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@popup/(.*)$': '<rootDir>/src/apps/popup/$1',
    '^@import-account-with-file/(.*)$':
      '<rootDir>/src/apps/import-account-with-file/$1',
    '^@connect-to-app/(.*)$': '<rootDir>/src/apps/connect-to-app/$1',
    '^@signature-request/(.*)$': '<rootDir>/src/apps/signature-request/$1',
    '^@onboarding/(.*)$': '<rootDir>/src/apps/onboarding/$1',
    '^@background/(.*)$': '<rootDir>/src/background/$1',
    '^@content/(.*)$': '<rootDir>/src/content/$1',
    '^@libs/(.*)$': '<rootDir>/src/libs/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1'
  },
  // Coverage universe (DEP-16 → DEP-99/P8.2): reducers keep the global 100%
  // gate; the background message handlers (the runtime security boundary) and
  // the redux sagas are now enforced too, at realistic per-directory floors set
  // to the coverage actually achieved (see coverageThreshold below). A file
  // matched by a path-specific threshold group is checked against it and
  // dropped from `global`; since reducers live under neither `handlers/` nor
  // `sagas/`, they stay on the `global` 100 gate while handlers/sagas are held
  // to their own overrides.
  collectCoverageFrom: [
    'src/background/redux/**/reducer.ts',
    'src/background/handlers/**/*.ts',
    'src/background/redux/sagas/**/*.ts',
    // The rest of `src/content/` is out of scope, but this module carries the
    // dapp-facing redaction and is pure, so it is held to the `global` 100 gate.
    'src/content/unknown-message-errors.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    // Types-only modules — no executable statements/branches to cover.
    '!src/background/handlers/types.ts',
    '!src/background/redux/sagas/types.ts'
  ],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  coverageReporters: ['json', 'text'],
  coverageThreshold: {
    // Reducers: full coverage is required and already met.
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    // Handlers (security boundary) — achieved ~95% stmts/lines, ~85% branch,
    // 100% funcs. sdk-methods' repeated per-method "missing tab id" throws are
    // intentionally not all exercised (full 100% of the 474-L router isn't a
    // goal); the floor reflects reality without filler tests.
    './src/background/handlers/': {
      branches: 85,
      functions: 100,
      lines: 95,
      statements: 95
    },
    // Sagas — vault-sagas is now broadly covered (account-derivation collision loop
    // and all sagaError paths); onboarding/check-casper2-network/trusted-wasm remain untested.
    // Floor set to achieved.
    './src/background/redux/sagas/': {
      branches: 74,
      functions: 63,
      lines: 79,
      statements: 79
    }
  },
  testPathIgnorePatterns: ['e2e-tests/', '<rootDir>/\\.claude/']
};
