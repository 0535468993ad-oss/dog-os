// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Features that predate the api/ folder layout keep their api.ts until they are migrated
// (see src/features/__tests__/featureStructure.test.ts).
const LEGACY_SUPABASE_FILES = [
  'src/features/*/api.ts',
  'src/features/auth/AuthProvider.tsx',
  'src/features/auth/sessionGuards.ts',
];

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
  {
    // Strictly typed contracts: untyped data is narrowed with type guards, never cast to any.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // No god files: 250 lines of code per module, 200 per component. Data and generated files are exempt.
    files: ['src/**/*.ts'],
    ignores: ['**/__tests__/**', 'src/lib/database.types.ts', 'src/features/legal/documents.ts'],
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['**/__tests__/**'],
    rules: {
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Supabase calls live in a feature's api/ folder only, so UI and logic stay backend-agnostic.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/**', 'src/features/*/api/**', '**/__tests__/**', ...LEGACY_SUPABASE_FILES],
    rules: {
      'no-restricted-imports': [
        'error',
        // Matches the @/ alias and relative paths alike.
        { patterns: [{ group: ['**/lib/supabase'], message: 'Supabase calls belong in the feature api/ folder.' }] },
      ],
    },
  },
]);
