module.exports = {
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}]
  },
  clearMocks: true,
  moduleDirectories: ['node_modules'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testRegex: '(/tests?/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/.*/__mocks__', '<rootDir>/e2e'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg|ttf|woff|woff2)$':
      '<rootDir>/__mocks__/file-mock.js',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@mocks/(.*)$': '<rootDir>/__mocks__/$1',
    '^@testHelpers/(.*)$': '<rootDir>/__testHelpers__/$1'
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
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
