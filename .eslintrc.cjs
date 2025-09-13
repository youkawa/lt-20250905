/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true, jest: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'unused-imports'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: { 'import/resolver': { typescript: true } },
  rules: {
    'unused-imports/no-unused-imports': 'warn',
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
      },
    ],
  },
  ignorePatterns: ['dist', 'node_modules', '.next', 'coverage'],
  overrides: [
    // Test/E2E/Mocks は any と未使用変数を緩和
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', 'apps/frontend/e2e/**/*.ts', 'apps/frontend/src/test/**/*.ts', 'apps/api/src/e2e/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
      },
    },
    // Next.js App Router の page など、段階的に型付けを進める対象
    {
      files: ['apps/frontend/src/app/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
