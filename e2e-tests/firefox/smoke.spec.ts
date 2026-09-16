import { expect, test } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import { download as downloadGeckodriver } from 'geckodriver';
import os from 'os';
import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Builder } from 'selenium-webdriver';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  Driver as FirefoxDriver,
  Options,
  ServiceBuilder
} from 'selenium-webdriver/firefox';

/**
 * Firefox e2e smoke — the DNR Referer rewrite on a real Firefox build.
 *
 * The RPC API authenticates by `Referer: https://casperwallet.io`, so a 200 from
 * an extension page proves the declarativeNetRequest rule rewrote it; 401 if not.
 */

const FIREFOX_BINARY =
  process.env.FIREFOX_BINARY ??
  '/Applications/Firefox.app/Contents/MacOS/firefox';

const BUILD_DIR = path.join(__dirname, '..', '..', 'build', 'firefox');

// A fixed add-on id we inject into the *build copy's* manifest (never src/), so
// that we can pre-seed a deterministic internal UUID for the extension origin.
const ADDON_ID = 'casper-wallet-e2e@casperwallet.io';
// Any fixed UUID works; Firefox reuses it from the pref instead of randomising.
const EXTENSION_UUID = 'b6b1a2c0-4d3e-4f5a-8b7c-000000001343';

const RPC_URL = 'https://node.cspr.cloud/rpc';

let driver: FirefoxDriver | undefined;
let tmpDir: string | undefined;

function buildXpi(): { xpiPath: string; tmpDir: string } {
  if (!fs.existsSync(path.join(BUILD_DIR, 'manifest.json'))) {
    throw new Error(
      `Firefox build not found at ${BUILD_DIR}. Run \`npm run build:firefox\` first.`
    );
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cw-firefox-smoke-'));
  const stageDir = path.join(dir, 'ext');
  fs.cpSync(BUILD_DIR, stageDir, { recursive: true });

  const manifestPath = path.join(stageDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  manifest.browser_specific_settings = manifest.browser_specific_settings ?? {};
  manifest.browser_specific_settings.gecko = {
    ...(manifest.browser_specific_settings.gecko ?? {}),
    id: ADDON_ID
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));

  const xpiPath = path.join(dir, 'casper-wallet-firefox.xpi');
  // manifest.json must live at the archive root, so zip from inside stageDir.
  execFileSync('zip', ['-r', '-X', '-q', xpiPath, '.'], { cwd: stageDir });

  return { xpiPath, tmpDir: dir };
}

test.afterAll(async () => {
  if (driver) {
    await driver.quit();
  }
  if (tmpDir) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Firefox loads the extension and the DNR Referer rewrite makes RPC return 200', async () => {
  const built = buildXpi();
  tmpDir = built.tmpDir;

  const geckodriverPath = await downloadGeckodriver();

  const options = new Options();
  options.setBinary(FIREFOX_BINARY);
  options.addArguments('-headless');
  options.setPreference(
    'extensions.webextensions.uuids',
    JSON.stringify({ [ADDON_ID]: EXTENSION_UUID })
  );
  // Reduce first-run noise / network chatter that could interfere.
  options.setPreference('app.update.enabled', false);
  options.setPreference('datareporting.policy.dataSubmissionEnabled', false);
  options.setPreference('toolkit.telemetry.enabled', false);
  options.setPreference('extensions.getAddons.cache.enabled', false);

  const service = new ServiceBuilder(geckodriverPath);

  // `Builder#build()` is typed as the base `WebDriver`, but `forBrowser('firefox')`
  // with a Firefox `ServiceBuilder` constructs a `firefox.Driver` at runtime.
  driver = (await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build()) as FirefoxDriver;

  const installedId = await driver.installAddon(built.xpiPath, true);
  expect(installedId).toBeTruthy();

  const popupUrl = `moz-extension://${EXTENSION_UUID}/popup.html`;
  await driver.get(popupUrl);
  const currentUrl = await driver.getCurrentUrl();
  expect(currentUrl).toBe(popupUrl);

  const result = (await driver.executeAsyncScript(
    `
      const done = arguments[arguments.length - 1];
      fetch(${JSON.stringify(RPC_URL)}, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"jsonrpc":"2.0","method":"info_get_status","id":1}'
      })
        .then(r => done({ status: r.status }))
        .catch(e => done({ status: -1, error: String(e && e.message || e) }));
    `
  )) as { status: number; error?: string };

  // eslint-disable-next-line no-console
  console.log('[firefox-smoke] RPC result:', JSON.stringify(result));

  expect(
    result.error,
    `fetch threw instead of completing: ${result.error}`
  ).toBeUndefined();
  expect(
    result.status,
    'RPC returned 401 => the DNR Referer rewrite did NOT apply on this Firefox build'
  ).toBe(200);
});
