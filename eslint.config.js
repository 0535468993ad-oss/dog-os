// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Edge Functions run on Deno (npm:/jsr: specifiers) and are checked by the Supabase CLI.
    ignores: ['dist/*', 'supabase/functions/*', 'legacy-backup/*', '.expo/*'],
  },
  {
    // Console output can leak personal data from production builds. App code reports through
    // reportError() in src/utils/errors.ts, the only file allowed to touch the console.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/utils/errors.ts', '**/__tests__/**'],
    rules: {
      'no-console': 'error',
    },
  },
]);
