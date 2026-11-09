// Flat ESLint config (Expo SDK 53+). `expo lint` picks this up automatically.
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*', 'node_modules/*']),
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    rules: {
      // Formatting problems are warnings so they never block a build; CI can
      // still fail on them by running `npx expo lint --max-warnings 0`.
      'prettier/prettier': 'warn',
    },
  },
]);
