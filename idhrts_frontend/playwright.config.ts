import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120000,
  expect: { timeout: 30000 },
  workers: 1,
  use: {
    baseURL: 'http://localhost',
  },
  // globalSetup: './e2e/real/global-setup.ts',  // disabled: Docker already serves pre-built app
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'real-e2e',
      testDir: './e2e/real',
      testMatch: '**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: false,
    },
  ],
  // No webServer — Docker is already running on port 80
});

