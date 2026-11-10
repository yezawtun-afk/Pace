/**
 * Jest config.
 *
 * `jest-expo` supplies the React Native / Expo transforms, and the alias entry
 * makes the `@/` import prefix work outside Metro (the app code uses it
 * everywhere).
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: ['src/features/habits/{schedule,stats}.ts'],
};
