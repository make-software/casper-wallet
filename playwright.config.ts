import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  testIgnore: '**/firefox/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  /* A single onboarding test creates the whole vault; the 30s default left no
   * headroom on a loaded CI runner and timed out mid-click. */
  timeout: 60_000,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',

    contextOptions: {
      permissions: ['clipboard-read', 'clipboard-write']
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
