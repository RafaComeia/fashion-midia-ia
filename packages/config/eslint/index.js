/**
 * Shared ESLint rules for all Fashion Mídia.IA apps.
 * Import and spread into each app's eslint.config.mjs.
 */

/** @type {import('eslint').Linter.RulesRecord} */
export const sharedRules = {
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/consistent-type-imports': 'error',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'prefer-const': 'error',
};
