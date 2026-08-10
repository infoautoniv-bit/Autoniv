export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: ['services/**/*.js', 'middleware/**/*.js', '!services/logger.js'],
};
