import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,
  globalSetup: './e2e/global-setup.ts',
  use: { baseURL: 'http://localhost:5174', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'pnpm --filter backend e2e:server',
      url: 'http://localhost:3100/api/health',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'pnpm exec vite',
      env: { SR_WEB_PORT: '5174', SR_API_PROXY: 'http://localhost:3100' },
      url: 'http://localhost:5174',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
