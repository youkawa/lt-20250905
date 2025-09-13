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
  settings: {
    'import/resolver': {
      typescript: {
        // Resolve TS path aliases in each workspace
        project: ['apps/frontend/tsconfig.json', 'apps/api/tsconfig.json'],
      },
    },
  },
  rules: {
    // 一時的に無効化（CI厳格運用と相性が悪いため、段階導入）
    'unused-imports/no-unused-imports': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
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
    // Test/E2E/Mocks は any と未使用変数を緩和（順序の都合で重ねて末尾にも定義）
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', 'apps/frontend/e2e/**/*.ts', 'apps/frontend/src/test/**/*.ts', 'apps/api/src/e2e/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'import/order': 'off',
      },
    },
    // フロントエンド本体: import/order を有効化（自動整形で順序統一）
    {
      files: ['apps/frontend/src/**/*.{ts,tsx,js}'],
      rules: {
        'import/order': [
          'error',
          {
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
            groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          },
        ],
        // any は原則禁止（テスト/モックは別オーバーライドで緩和）
        '@typescript-eslint/no-explicit-any': 'error',
        // 段階導入: まず未使用変数をエラー化
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
        ],
      },
    },
    // テスト/モックを最終的に再緩和（このブロックが最後に適用される）
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', 'apps/frontend/src/**/__mocks__/**'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
