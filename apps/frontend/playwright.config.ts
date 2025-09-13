import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'sh -c "npm run start"',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_NOTEBOOK_BASE_URL: 'http://notebook',
      NEXT_PUBLIC_USER_ID: 'u1',
    },
  },
});
