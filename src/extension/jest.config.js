/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
};
