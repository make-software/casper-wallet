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
  apply?: (compiler: FakeCompiler) => void;
}

type EntryLike = Record<string, string | string[]>;

interface ConfigLike {
  plugins: PluginLike[];
  entry: EntryLike;
}

interface Manifest {
  content_security_policy?: string | { extension_pages: string };
}

/** The slice of webpack's compilation/compiler API the emit-time assertion touches. */
interface FakeAsset {
  source: { source: () => string };
}

interface FakeCompilation {
  hooks: { processAssets: { tap: (options: unknown, fn: () => void) => void } };
  getAsset: (name: string) => FakeAsset | undefined;
  entrypoints: Map<string, { getFiles: () => string[] }>;
}

interface FakeCompiler {
  options: { entry: Record<string, { import: string[] }> };
  hooks: {
    thisCompilation: {
      tap: (name: string, fn: (compilation: FakeCompilation) => void) => void;
    };
  };
}

interface LoadedConfig {
  /** Raw DefinePlugin substitution — a JSON literal: `"<base64>"` or `null`. */
  nonceLiteral: string;
  manifest: Manifest;
  /** The AssertCspNonceIntegrity instance registered by this config. */
  assertPlugin: PluginLike;
  entry: EntryLike;
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

  const assertPlugin = config.plugins.find(
    plugin => plugin.constructor?.name === 'AssertCspNonceIntegrity'
  );

  if (!assertPlugin) {
    throw new Error('AssertCspNonceIntegrity is not registered');
  }

  return {
    nonceLiteral: definitions.__CSP_NONCE__,
    manifest: JSON.parse(
      manifestPattern
        .transform(fs.readFileSync(path.join(ROOT, manifestPattern.from)))
        .toString()
    ),
    assertPlugin,
    entry: config.entry
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

/**
 * The casper-assets host was removed from host_permissions/permissions (and the CSP
 * arms) in five places; only the CSP side had a guard (see the nonce block above,
 * which itself doesn't check for this string). This asserts against the manifest as
 * CopyWebpackPlugin actually emits it — not src/manifest.*.json directly — because a
 * transform that reintroduced the host would still leave the source files clean.
 * Stringifying the whole manifest, rather than reading a specific key, catches the
 * host resurfacing in `permissions` (where MV2/Safari embed their host allowlist),
 * `host_permissions` (MV3's separate array), or `content_security_policy` alike.
 */
describe('manifest host allowlist', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it.each(['chrome', 'firefox', 'safari'])(
    'keeps the casper-assets host out of the built %s manifest',
    browser => {
      const { manifest } = loadConfig(browser, 'production');

      expect(JSON.stringify(manifest)).not.toContain('casper-assets');
    }
  );
});

/**
 * The assertions above compare the two nonce channels as the config *describes* them.
 * AssertCspNonceIntegrity (webpack.config.js) compares them as the build *emits* them,
 * which is where WALLET-1388 went wrong: an ambient CSP_NONCE was substituted into the
 * bundles through dotenv-webpack's `systemvars` while the manifest kept the generated
 * value, and the build reported success.
 *
 * Driving it needs only four things off the compiler/compilation, faked here: the two
 * hooks it taps, the normalized entry, the entrypoint file lists, and getAsset.
 */
const asset = (content: string): FakeAsset => ({
  source: { source: () => content }
});

const runAssertion = ({
  assertPlugin,
  entry,
  manifestJson,
  bundles
}: {
  assertPlugin: PluginLike;
  entry: EntryLike;
  /** `null` stands for "the build emitted no manifest at all". */
  manifestJson: string | null;
  bundles: Record<string, string>;
}) => {
  let tapped: (() => void) | undefined;

  const compilation: FakeCompilation = {
    hooks: {
      processAssets: {
        tap: (_options, fn) => {
          tapped = fn;
        }
      }
    },
    getAsset: name => {
      if (name === 'manifest.json') {
        return manifestJson === null ? undefined : asset(manifestJson);
      }

      return name in bundles ? asset(bundles[name]) : undefined;
    },
    entrypoints: new Map(
      Object.keys(entry).map(name => [
        name,
        { getFiles: () => [`${name}.bundle.js`] }
      ])
    )
  };

  // The real entry is reused rather than invented, so a change to which entries get
  // the nonce setter prepended reaches these cases automatically.
  const compiler: FakeCompiler = {
    options: {
      entry: Object.fromEntries(
        Object.entries(entry).map(([name, files]) => [
          name,
          { import: Array.isArray(files) ? files : [files] }
        ])
      )
    },
    hooks: {
      thisCompilation: {
        tap: (_name, fn) => fn(compilation)
      }
    }
  };

  assertPlugin.apply?.(compiler);

  if (!tapped) {
    throw new Error('AssertCspNonceIntegrity tapped no processAssets hook');
  }

  return tapped;
};

const manifestWith = (csp: string | undefined) =>
  JSON.stringify(
    csp === undefined
      ? {}
      : { content_security_policy: { extension_pages: csp } }
  );

describe('AssertCspNonceIntegrity', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Chrome production', () => {
    const load = () => {
      const { nonceLiteral, assertPlugin, entry } = loadConfig(
        'chrome',
        'production'
      );
      const nonce: string = JSON.parse(nonceLiteral);
      // Every entry that gets the setter carries the substituted literal; the rest
      // (background, contentScript, sdk) never read it.
      const bundles = Object.fromEntries(
        Object.entries(entry).map(([name, files]) => [
          `${name}.bundle.js`,
          Array.isArray(files)
            ? `__webpack_nonce__ = "${nonce}";`
            : 'no nonce here'
        ])
      );

      return { nonce, assertPlugin, entry, bundles };
    };

    it('passes when the manifest and every nonce-carrying bundle agree', () => {
      const { nonce, assertPlugin, entry, bundles } = load();

      expect(
        runAssertion({
          assertPlugin,
          entry,
          manifestJson: manifestWith(`style-src 'self' 'nonce-${nonce}'`),
          bundles
        })
      ).not.toThrow();
    });

    it('rejects a build whose bundles carry a different nonce', () => {
      const { nonce, assertPlugin, entry, bundles } = load();

      expect(
        runAssertion({
          assertPlugin,
          entry,
          manifestJson: manifestWith(`style-src 'self' 'nonce-${nonce}'`),
          // What an ambient CSP_NONCE used to produce.
          bundles: { ...bundles, 'popup.bundle.js': '"SHADOWVALUE123";' }
        })
      ).toThrow(/no bundle of entry "popup" contains it/);
    });

    it('rejects a build whose manifest pins a nonce this build did not generate', () => {
      const { assertPlugin, entry, bundles } = load();

      expect(
        runAssertion({
          assertPlugin,
          entry,
          manifestJson: manifestWith("style-src 'self' 'nonce-SOMETHINGELSE'"),
          bundles
        })
        // Anchored on the second clause: the per-entry check below reports the same
        // "the manifest pins …" prefix, and this case has to fail on the manifest
        // comparison specifically.
      ).toThrow(/pins "SOMETHINGELSE", but this build generated/);
    });

    it('rejects a build whose manifest pins no nonce at all', () => {
      const { assertPlugin, entry, bundles } = load();

      expect(
        runAssertion({
          assertPlugin,
          entry,
          manifestJson: manifestWith("style-src 'unsafe-inline'"),
          bundles
        })
      ).toThrow(/pins null, but this build generated/);
    });

    it('rejects a build that emitted no manifest', () => {
      const { assertPlugin, entry, bundles } = load();

      expect(
        runAssertion({ assertPlugin, entry, manifestJson: null, bundles })
      ).toThrow(/emitted no manifest\.json/);
    });
  });

  describe('targets without a nonce', () => {
    it.each(['firefox', 'safari'])(
      'passes a %s build whose manifest pins nothing',
      browser => {
        const { assertPlugin, entry } = loadConfig(browser, 'production');

        expect(
          runAssertion({
            assertPlugin,
            entry,
            manifestJson: manifestWith(
              browser === 'safari' ? undefined : "style-src 'unsafe-inline'"
            ),
            bundles: {}
          })
        ).not.toThrow();
      }
    );

    it('rejects a Firefox build whose manifest pins one anyway', () => {
      const { assertPlugin, entry } = loadConfig('firefox', 'production');

      expect(
        runAssertion({
          assertPlugin,
          entry,
          manifestJson: manifestWith("style-src 'self' 'nonce-LEAKED'"),
          bundles: {}
        })
      ).toThrow(/but this build generated null/);
    });
  });
});
