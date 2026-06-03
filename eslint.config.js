import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'scripts/**', '.mastra/**', '.superpowers/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'bin/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // The codebase intentionally uses `any` at a few API boundaries (GraphQL/
      // Notion responses) — surface as a warning, not a hard error.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow underscore-prefixed intentionally-unused args/vars.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
);
