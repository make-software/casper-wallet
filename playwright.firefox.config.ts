import { defineConfig } from '@playwright/test';

/**
 * Firefox e2e smoke harness. Playwright can neither install a temporary extension
 * into its bundled Firefox nor attach to a system one, so the smoke drives a real
 * Firefox via selenium-webdriver + geckodriver; the Playwright runner is reused
 * only for TypeScript execution, test structure and `expect`.
 */
export default defineConfig({
  testDir: './e2e-tests/firefox',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  // Firefox cold-start + geckodriver download + temporary install + a live RPC
  // round-trip. Generous so a slow network doesn't produce a flaky failure.
  timeout: 180_000
});
