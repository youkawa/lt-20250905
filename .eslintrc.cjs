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
};

