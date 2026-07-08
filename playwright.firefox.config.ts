import { defineConfig } from '@playwright/test';

/**
 * Firefox e2e smoke harness (WALLET-1343 / DEP-99, Task 5.4 spike).
 *
 * This config does NOT use Playwright's browser automation. Playwright cannot
 * install a temporary extension into its bundled Firefox and cannot attach to a
 * system Firefox, so the smoke drives a real Firefox 152 via selenium-webdriver
 * + geckodriver (see e2e-tests/firefox/smoke.spec.ts). We reuse the Playwright
 * test runner purely for TypeScript execution, test structure and `expect`.
 *
 * Kept separate from the Chrome config (playwright.config.ts) so the two suites
 * never share projects/fixtures.
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
