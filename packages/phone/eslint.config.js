import preact from 'eslint-config-preact';
import tseslint from 'typescript-eslint';

/**
 * ESLint 9 flat config (AD-015): the Preact preset, with the `typescript-eslint`
 * parser for `.ts`/`.tsx`, because the preset's Babel parser does not read TypeScript.
 */
export default [
  { ignores: ['dist/', 'node_modules/', 'test-results/', 'playwright-report/'] },
  ...preact,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // The compiler already checks names and redeclarations; the core rules misread types.
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'after-used', ignoreRestSiblings: true }],
    },
  },
  {
    rules: {
      // A missing hook dependency is a bug, not a style hint.
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
