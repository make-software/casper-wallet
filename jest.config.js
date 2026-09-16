module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(j|t)sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }]
  },
  // Half the cores, not all-but-one: several agent sessions run this suite at once on a
  // 10-core machine, and the wall clock of a lone run is the same either way.
  maxWorkers: '50%',
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@lapo/asn1js|@noble/ciphers|@formatjs|intl-messageformat|casper-wallet-core|uuid|@ledgerhq/device-transport-kit-web-hid|@ledgerhq/device-transport-kit-web-ble)/)'
  ],
  // __CSP_NONCE__ is substituted by webpack's DefinePlugin, which never runs under
  // jest; null matches its declared type and every non-Chrome-production build.
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
    // Both kits export only an `import` condition, which jest's CJS resolver
    // cannot satisfy; transformIgnorePatterns above transpiles the ESM entry.
    '^@ledgerhq/device-transport-kit-web-hid$':
      '<rootDir>/node_modules/@ledgerhq/device-transport-kit-web-hid/lib/esm/index.js',
    '^@ledgerhq/device-transport-kit-web-ble$':
      '<rootDir>/node_modules/@ledgerhq/device-transport-kit-web-ble/lib/esm/index.js',
    // ts-jest compiles to CommonJS, where the `import.meta.url` that webpack
    // needs to emit the worker chunk is a syntax error.
    '^(.*)/spawn-scrypt-worker$':
      '<rootDir>/src/background/workers/spawn-scrypt-worker.stub.ts',
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
  // A file matched by a path-specific threshold group is dropped from `global`;
  // reducers match neither, so they stay on the `global` 100% gate.
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
    // Handlers (security boundary): sdk-methods' repeated per-method "missing tab
    // id" throws are intentionally not all exercised, so the floor is below 100.
    './src/background/handlers/': {
      branches: 85,
      functions: 100,
      lines: 95,
      statements: 95
    },
    // Sagas — onboarding, check-casper2-network and trusted-wasm are untested;
    // the floor is set to the coverage actually achieved.
    './src/background/redux/sagas/': {
      branches: 74,
      functions: 63,
      lines: 79,
      statements: 79
    }
  },
  testPathIgnorePatterns: ['e2e-tests/', '<rootDir>/\\.claude/']
};
