module.exports = {
  roots: ['<rootDir>'],
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/jest.tsconfig.json' }]
  },
  clearMocks: true,
  moduleDirectories: ['node_modules'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testRegex: '(/tests?/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['js', 'ts'],
  modulePathIgnorePatterns: ['<rootDir>/.*/__mocks__', '<rootDir>/src'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  testTimeout: 30000
};
