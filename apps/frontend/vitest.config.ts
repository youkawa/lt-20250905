import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 動的importが解決できずに失敗するため、テスト時はスタブに差し替え
      '@datalayer/jupyter-ui': path.resolve(__dirname, './src/test/__mocks__/jupyter-ui.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/lib/**/*.test.ts', 'src/lib/**/*.test.tsx'],
    exclude: ['e2e/**', 'src/app/**', 'src/components/**'],
  },
});
