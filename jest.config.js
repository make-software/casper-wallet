module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(j|t)sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@lapo/asn1js|@noble/ciphers|@formatjs|intl-messageformat|casper-wallet-core|uuid)/)'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testRegex: '(/tests?/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/e2e-tests'],
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
  // to the coverage actually achieved (see coverageThreshold below). Jest
  // matches each file to its LONGEST path key, so reducers stay on `global` 100
  // while handlers/sagas use their own overrides.
  collectCoverageFrom: [
    'src/background/redux/**/reducer.ts',
    'src/background/handlers/**/*.ts',
    'src/background/redux/sagas/**/*.ts',
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
    // Sagas — vault-sagas is partly tested (Task 8.1); onboarding/network/
    // trusted-wasm sagas remain untested for now. Floor set to achieved (~48%
    // stmts/lines, ~47% branch, ~37% funcs) so the gate is real, not fiction.
    './src/background/redux/sagas/': {
      branches: 45,
      functions: 35,
      lines: 45,
      statements: 45
    }
  },
  testPathIgnorePatterns: ['e2e-tests/']
};
