import fs from 'fs';
import path from 'path';

/**
 * The Chrome-production CSP nonce is wired through two independent channels: the
 * `content_security_policy` baked into the manifest, and the `__CSP_NONCE__` literal
 * substituted into every bundle. They are generated from a single predicate in
 * webpack.config.js, and nothing else in CI evaluates that file — `knip` executes it
 * only to harvest entries and aliases, and format/lint/tsc/jest never load it.
 *
 * If the two ever disagree, the failure is silent and total: the manifest pins
 * `style-src` to a nonce no bundle sets (or to the literal `nonce-null`), every
 * styled-components sheet and style-loader <style> is blocked, and all five apps
 * render unstyled while the DOM stays fully present — which e2e's `toBeVisible()`
 * assertions happily accept.
 *
 * So this file asserts the invariant rather than the value: the manifest CSP carries
 * a nonce if and only if the bundle literal is a non-empty string, and it is the same
 * string.
 */

const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'webpack.config.js');

interface CopyPattern {
  from: string;
  transform?: (content: Buffer) => Buffer;
}

interface PluginLike {
  definitions?: Record<string, string>;
  patterns?: CopyPattern[];
  options?: { patterns?: CopyPattern[] };
}

interface ConfigLike {
  plugins: PluginLike[];
}

interface Manifest {
  content_security_policy?: string | { extension_pages: string };
}

interface LoadedConfig {
  /** Raw DefinePlugin substitution — a JSON literal: `"<base64>"` or `null`. */
  nonceLiteral: string;
  manifest: Manifest;
}

const loadConfig = (browser: string, nodeEnv: string): LoadedConfig => {
  process.env.BROWSER = browser;
  process.env.NODE_ENV = nodeEnv;
  // webpack.config.js and its ./constants + ./utils/env dependencies read the env
  // at require time, so the whole chain has to be re-evaluated per combination.
  jest.resetModules();

  // A static import would be hoisted and evaluated once, before any of the env
  // juggling above; the whole point here is to re-evaluate per combination.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config: ConfigLike = require(CONFIG_PATH);

  const definitions = config.plugins.find(
    plugin => plugin.definitions?.__CSP_NONCE__ !== undefined
  )?.definitions;

  if (!definitions) {
    throw new Error('DefinePlugin does not define __CSP_NONCE__');
  }

  const manifestPattern = config.plugins
    .flatMap(plugin => plugin.patterns ?? plugin.options?.patterns ?? [])
    .find(pattern => typeof pattern.transform === 'function');

  if (!manifestPattern?.transform) {
    throw new Error('No CopyWebpackPlugin pattern generates the manifest');
  }

  return {
    nonceLiteral: definitions.__CSP_NONCE__,
    manifest: JSON.parse(
      manifestPattern
        .transform(fs.readFileSync(path.join(ROOT, manifestPattern.from)))
        .toString()
    )
  };
};

/** Chrome uses the MV3 object form, Firefox the MV2 string; Safari gets neither. */
const flattenCSP = (manifest: Manifest): string | undefined =>
  typeof manifest.content_security_policy === 'string'
    ? manifest.content_security_policy
    : manifest.content_security_policy?.extension_pages;

const MATRIX = [
  { browser: 'chrome', nodeEnv: 'production', expectsNonce: true },
  { browser: 'chrome', nodeEnv: 'development', expectsNonce: false },
  { browser: 'firefox', nodeEnv: 'production', expectsNonce: false },
  { browser: 'firefox', nodeEnv: 'development', expectsNonce: false },
  { browser: 'safari', nodeEnv: 'production', expectsNonce: false },
  { browser: 'safari', nodeEnv: 'development', expectsNonce: false }
];

describe('webpack.config.js CSP nonce', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe.each(MATRIX)(
    'BROWSER=$browser NODE_ENV=$nodeEnv',
    ({ browser, nodeEnv, expectsNonce }) => {
      it(`${expectsNonce ? 'pins style-src to a nonce that the bundle also sets' : 'emits no nonce anywhere'}`, () => {
        const { nonceLiteral, manifest } = loadConfig(browser, nodeEnv);
        const csp = flattenCSP(manifest);

        if (!expectsNonce) {
          expect(nonceLiteral).toBe('null');

          if (csp !== undefined) {
            expect(csp).toContain("style-src 'unsafe-inline'");
            expect(csp).not.toContain('nonce-');
          }

          return;
        }

        // 16 random bytes, base64 — the literal is JSON-quoted by DefinePlugin.
        expect(nonceLiteral).toMatch(/^"[A-Za-z0-9+/]{22}=="$/);

        const nonce = JSON.parse(nonceLiteral);

        expect(csp).toContain(
          `style-src 'self' 'nonce-${nonce}'; style-src-attr 'unsafe-inline'`
        );
        // A nonce is worthless next to 'unsafe-inline' on the same directive.
        expect(csp).not.toMatch(/style-src '[^']*unsafe-inline/);
      });

      it('keeps the manifest CSP and the bundle literal in agreement', () => {
        const { nonceLiteral, manifest } = loadConfig(browser, nodeEnv);
        const csp = flattenCSP(manifest) ?? '';

        // The one property worth protecting: neither side may carry a nonce alone.
        expect(csp.includes('nonce-')).toBe(nonceLiteral !== 'null');
        expect(csp).not.toContain('nonce-null');
      });
    }
  );

  // Pre-existing behaviour, asserted so a change to it is a deliberate one rather
  // than a surprise: getCSP() returns undefined for Safari (it branches on isFirefox
  // and isChrome only), and none of the three source manifests declares a CSP of its
  // own, so the built Safari manifest ships without a content_security_policy key.
  it.each(['production', 'development'])(
    'leaves the Safari manifest (NODE_ENV=%s) without a CSP',
    nodeEnv => {
      const { manifest } = loadConfig('safari', nodeEnv);

      expect(manifest.content_security_policy).toBeUndefined();
    }
  );
});
