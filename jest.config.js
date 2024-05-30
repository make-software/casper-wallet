module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(j|t)sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!micro-aes-gcm/.*)'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testRegex: '(/tests?/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/e2e-tests'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  coverageReporters: ['json', 'text'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
