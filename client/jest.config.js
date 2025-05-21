/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',

    // Handle static assets
    '\\.(jpg|jpeg|png|gif|webp|svg|pdf)$': '<rootDir>/__mocks__/fileMock.js',
    
    // Mock UI components
    '^@/components/ui/(.*)$': '<rootDir>/__mocks__/@/components/ui/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      // Use babel-jest for TypeScript files
      babelConfig: true,
      isolatedModules: true, // This is important for performance and compatibility
      tsconfig: {
        // Override tsconfig for tests
        jsx: "react-jsx",
        esModuleInterop: true,
        moduleResolution: "node"
      }
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__mocks__/',
  ],
}; 