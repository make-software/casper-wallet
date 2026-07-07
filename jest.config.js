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
  // Coverage gate decision (DEP-16, shared with P1.6/DEP-5): the global 100%
  // threshold now applies to this explicit universe instead of "whatever a
  // test happens to import". P1.6 will widen the universe with realistic
  // targets when the background test foundation lands.
  collectCoverageFrom: ['src/background/redux/**/reducer.ts', '!**/*.d.ts'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  coverageReporters: ['json', 'text'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  testPathIgnorePatterns: ['e2e-tests/']
};
