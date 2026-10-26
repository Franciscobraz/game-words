import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tools/play/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:5173', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npm run play',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
