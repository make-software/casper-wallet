import fs from 'fs';
import os from 'os';
import path from 'path';

import pkg from '../package.json';
// The alias table the sideEffects check resolves specifiers through, read from
// the same file the compiler uses so the two cannot drift.
import tsconfig from '../tsconfig.json';
// The module webpack.config.js resolves the version stamp through. Imported by
// path because utils/ is plain CommonJS, outside tsconfig's `include`.
import {
  BUILD_HASH_FILE,
  UNKNOWN_COMMIT_HASH,
  resolveCommitHash
} from '../utils/commit-hash';

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
const BUILD_SRC_PATH = path.join(ROOT, 'scripts', 'build_src.sh');

/** Any sha will do; it only has to be the one the config stamps back out. */
const TEST_COMMIT_HASH = 'abc1234def5678901234567890abcdef12345678';

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

/** The shape of a chunk as far as the splitChunks predicate is concerned. */
interface ChunkLike {
  name?: string;
  canBeInitial: () => boolean;
}

interface ConfigLike {
  plugins: PluginLike[];
  entry: EntryLike;
  optimization?: { splitChunks?: { chunks?: (chunk: ChunkLike) => boolean } };
}

interface Manifest {
  content_security_policy?: string | { extension_pages: string };
  version_name?: string;
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
  /** The AssertSingleFileEntries instance registered by this config. */
  singleFilePlugin: PluginLike;
  /** The AssertSdkFreePageEntries instance registered by this config. */
  sdkFreePlugin: PluginLike;
  /** optimization.splitChunks.chunks — the predicate deciding what may split. */
  splitChunksPredicate: (chunk: ChunkLike) => boolean;
  entry: EntryLike;
}

const loadConfig = (browser: string, nodeEnv: string): LoadedConfig => {
  process.env.BROWSER = browser;
  process.env.NODE_ENV = nodeEnv;
  // Pinned rather than inherited: GITHUB_SHA is set for every CI job, so without
  // this the config would resolve a different commit stamp under CI than locally.
  process.env.HASH = TEST_COMMIT_HASH;
  delete process.env.GITHUB_SHA;
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

  const singleFilePlugin = config.plugins.find(
    plugin => plugin.constructor?.name === 'AssertSingleFileEntries'
  );

  if (!singleFilePlugin) {
    throw new Error('AssertSingleFileEntries is not registered');
  }

  const sdkFreePlugin = config.plugins.find(
    plugin => plugin.constructor?.name === 'AssertSdkFreePageEntries'
  );

  if (!sdkFreePlugin) {
    throw new Error('AssertSdkFreePageEntries is not registered');
  }

  const splitChunksPredicate = config.optimization?.splitChunks?.chunks;

  if (typeof splitChunksPredicate !== 'function') {
    throw new Error('optimization.splitChunks.chunks is not a predicate');
  }

  return {
    singleFilePlugin,
    sdkFreePlugin,
    splitChunksPredicate,
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
            expect(csp).toContain("style-src 'self' 'unsafe-inline'");
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
 * WALLET-1392: `manifest.version_name` used to fall back to `Date.now()` when no
 * commit hash was in the environment. scripts/build_src.sh zips `src scripts utils
 * *.* .env` and no `.git`, so on the tree an AMO reviewer unpacks, the build
 * scripts' `HASH=$(git rev-parse HEAD)` resolves to the empty string and the
 * fallback fired — the rebuilt manifest read `2.7.0 (1785914)` against the
 * uploaded artifact's `2.7.0 (905e0c8)`, and source-review comparison failed on
 * manifest.json alone.
 *
 * The stamp now comes from the source package itself (build-hash.json), and there
 * is no per-build-varying fallback left to reach.
 */
describe('commit hash resolution', () => {
  /** A root holding whatever build-hash.json the case is about (or none). */
  const rootWith = (buildHashFile?: string): string => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'commit-hash-'));

    if (buildHashFile !== undefined) {
      fs.writeFileSync(path.join(root, BUILD_HASH_FILE), buildHashFile);
    }

    return root;
  };

  it('prefers HASH, which the build scripts read out of the git checkout', () => {
    const root = rootWith(JSON.stringify({ commitHash: 'ffffffffff' }));

    expect(
      resolveCommitHash({
        root,
        env: { HASH: TEST_COMMIT_HASH, GITHUB_SHA: 'eeeeeeeeee' }
      })
    ).toBe(TEST_COMMIT_HASH);
  });

  it('falls back to GITHUB_SHA when HASH is absent', () => {
    expect(
      resolveCommitHash({ root: rootWith(), env: { GITHUB_SHA: 'eeeeeeeeee' } })
    ).toBe('eeeeeeeeee');
  });

  it('reads the shipped stamp when HASH resolves empty off a git tree', () => {
    const root = rootWith(JSON.stringify({ commitHash: TEST_COMMIT_HASH }));

    // Exactly what `HASH=$(git rev-parse HEAD)` leaves behind when git fails:
    // the variable is set, to nothing.
    expect(resolveCommitHash({ root, env: { HASH: '' } })).toBe(
      TEST_COMMIT_HASH
    );
  });

  it('refuses to stamp a production build it cannot attribute to a commit', () => {
    expect(() =>
      resolveCommitHash({ root: rootWith(), env: {}, isDev: false })
    ).toThrow(/no commit hash available/);
  });

  it('resolves the same value on every dev build that reaches the fallback', () => {
    const root = rootWith();
    const first = resolveCommitHash({ root, env: {}, isDev: true });

    expect(first).toBe(UNKNOWN_COMMIT_HASH);
    // The defect in one line: a fallback that differs per build.
    expect(resolveCommitHash({ root, env: {}, isDev: true })).toBe(first);
    expect(first).not.toMatch(/^\d{13}$/);
  });

  it.each([
    ['malformed JSON', 'not json at all'],
    ['a missing commitHash', JSON.stringify({ sha: TEST_COMMIT_HASH })],
    ['a non-sha commitHash', JSON.stringify({ commitHash: 'v2.7.0-rc1' })],
    ['a non-string commitHash', JSON.stringify({ commitHash: 1785914829890 })]
  ])('rejects a shipped stamp with %s', (_case, buildHashFile) => {
    // A broken stamp must not degrade into the unknown/placeholder path — that
    // would put the reviewer back on a manifest that cannot match the upload.
    expect(() =>
      resolveCommitHash({ root: rootWith(buildHashFile), env: {}, isDev: true })
    ).toThrow(new RegExp(BUILD_HASH_FILE));
  });

  it('is what build_src.sh writes into the source package', () => {
    const script = fs.readFileSync(BUILD_SRC_PATH, 'utf8');

    // The producer and the consumer of the stamp live in different languages and
    // are only ever exercised together by a full release build.
    expect(script).toContain(`> ${BUILD_HASH_FILE}`);
    expect(script).toMatch(new RegExp(`zip .*\\b${BUILD_HASH_FILE}\\b`));
  });

  it.each(['chrome', 'firefox', 'safari'])(
    'stamps the resolved commit into the built %s manifest',
    browser => {
      const originalEnv = { ...process.env };

      try {
        const { manifest } = loadConfig(browser, 'production');

        expect(manifest.version_name).toBe(
          `${pkg.version} (${TEST_COMMIT_HASH.slice(0, 7)})`
        );
      } finally {
        process.env = { ...originalEnv };
      }
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

/**
 * The guards that keep the MV3 service worker and the two content scripts
 * single-file now that splitChunks is on. They had no test of their own, in the
 * one file that exists because nothing else in CI evaluates webpack.config.js —
 * relaxing `files.length !== 1` to `< 1` left ci-check green.
 */
interface FakeEntrypoint {
  getFiles: () => string[];
  getChildren: () => FakeEntrypoint[];
}

const fakeEntrypoint = (
  files: string[],
  asyncFiles: string[] = []
): FakeEntrypoint => ({
  getFiles: () => files,
  getChildren: () =>
    asyncFiles.map(file => ({
      getFiles: () => [file],
      getChildren: () => []
    }))
});

const runSingleFileAssertion = (
  plugin: PluginLike,
  entrypoints: Record<string, FakeEntrypoint>
) => {
  let tapped: (() => void) | undefined;

  const compilation = {
    hooks: {
      processAssets: {
        tap: (_options: unknown, fn: () => void) => {
          tapped = fn;
        }
      }
    },
    entrypoints: new Map(Object.entries(entrypoints))
  };

  plugin.apply?.({
    hooks: {
      thisCompilation: {
        tap: (_name: string, fn: (c: unknown) => void) => fn(compilation)
      }
    }
  } as unknown as FakeCompiler);

  if (!tapped) {
    throw new Error('AssertSingleFileEntries tapped no processAssets hook');
  }

  return tapped;
};

/** Every single-file entry, each emitting exactly one JS file and no chunks. */
const healthyEntrypoints = (): Record<string, FakeEntrypoint> => ({
  background: fakeEntrypoint(['background.bundle.js']),
  contentScript: fakeEntrypoint(['contentScript.bundle.js']),
  sdk: fakeEntrypoint(['sdk.bundle.js'])
});

describe('AssertSingleFileEntries', () => {
  it('accepts one JS file per single-file entry', () => {
    const { singleFilePlugin } = loadConfig('chrome', 'production');

    expect(
      runSingleFileAssertion(singleFilePlugin, healthyEntrypoints())
    ).not.toThrow();
  });

  it('ignores non-JS files in the entrypoint', () => {
    const { singleFilePlugin } = loadConfig('chrome', 'production');

    expect(
      runSingleFileAssertion(singleFilePlugin, {
        ...healthyEntrypoints(),
        background: fakeEntrypoint([
          'background.bundle.js',
          'background.bundle.js.map'
        ])
      })
    ).not.toThrow();
  });

  it('rejects an entry split across two JS files', () => {
    const { singleFilePlugin } = loadConfig('chrome', 'production');

    expect(
      runSingleFileAssertion(singleFilePlugin, {
        ...healthyEntrypoints(),
        contentScript: fakeEntrypoint([
          'vendors.bundle.js',
          'contentScript.bundle.js'
        ])
      })
    ).toThrow(/emitted 2 JS files/);
  });

  it('rejects an entry the build did not emit at all', () => {
    const { singleFilePlugin } = loadConfig('chrome', 'production');
    const entrypoints = healthyEntrypoints();
    delete entrypoints.sdk;

    expect(runSingleFileAssertion(singleFilePlugin, entrypoints)).toThrow(
      /emitted no entry "sdk"/
    );
  });

  // None of the three can load one: a content script would fetch it from the
  // visited site's origin, and the service worker has no document.
  it.each(['contentScript', 'sdk', 'background'])(
    'rejects an async chunk owned by %s',
    name => {
      const { singleFilePlugin } = loadConfig('chrome', 'production');

      expect(
        runSingleFileAssertion(singleFilePlugin, {
          ...healthyEntrypoints(),
          [name]: fakeEntrypoint([`${name}.bundle.js`], ['417.bundle.js'])
        })
      ).toThrow(/emitted 1 async chunk/);
    }
  );

  it('follows async chunks reached through another async chunk', () => {
    // Still a chunk this entry owns; a first-level-only walk would miss it.
    const { singleFilePlugin } = loadConfig('chrome', 'production');
    const nested = {
      getFiles: () => ['nested.bundle.js'],
      getChildren: () => []
    };

    expect(
      runSingleFileAssertion(singleFilePlugin, {
        ...healthyEntrypoints(),
        sdk: {
          getFiles: () => ['sdk.bundle.js'],
          getChildren: () => [
            { getFiles: () => ['417.bundle.js'], getChildren: () => [nested] }
          ]
        }
      })
    ).toThrow(/emitted 2 async chunk/);
  });
});

/**
 * AssertSdkFreePageEntries is the only thing keeping the ~900 KB UMD SDK off the
 * pages this branch cleared, and its inputs are undocumented webpack internals:
 * chunkGraph/moduleGraph, and a ConcatenatedModule's members hanging off
 * `.modules` rather than a `resource` of its own. A build only proves the guard
 * silent, never that it can still speak — so the cases below drive it against a
 * compilation that does contain the SDK.
 *
 * The entry list is asserted through behaviour rather than read out of the
 * config: dropping a name from SDK_FREE_PAGE_ENTRY_NAMES is exactly the silent
 * revert this file exists to catch.
 */
interface FakeModule {
  resource?: string;
  /** A ConcatenatedModule's merged members; it carries no `resource` itself. */
  modules?: FakeModule[];
}

interface FakeChunk {
  modules: FakeModule[];
}

const SDK_RESOURCE = path.join(
  ROOT,
  'node_modules',
  'casper-js-sdk',
  'dist',
  'index.js'
);

const srcModule = (relative: string): FakeModule => ({
  resource: path.join(ROOT, 'src', relative)
});

const runSdkFreeAssertion = (
  plugin: PluginLike,
  entrypoints: Record<string, FakeChunk[]>,
  /** module -> the module webpack blames for pulling it in. */
  issuers: Map<FakeModule, FakeModule> = new Map()
) => {
  let tapped: (() => void) | undefined;

  const compilation = {
    hooks: {
      processAssets: {
        tap: (_options: unknown, fn: () => void) => {
          tapped = fn;
        }
      }
    },
    entrypoints: new Map(
      Object.entries(entrypoints).map(([name, chunks]) => [name, { chunks }])
    ),
    chunkGraph: {
      getChunkModulesIterable: (chunk: FakeChunk) => chunk.modules
    },
    moduleGraph: {
      getIssuer: (module: FakeModule) => issuers.get(module)
    }
  };

  plugin.apply?.({
    hooks: {
      thisCompilation: {
        tap: (_name: string, fn: (c: unknown) => void) => fn(compilation)
      }
    }
  } as unknown as FakeCompiler);

  if (!tapped) {
    throw new Error('AssertSdkFreePageEntries tapped no processAssets hook');
  }

  return tapped;
};

const PAGE_ENTRY_NAMES = [
  'popup',
  'importAccountWithFile',
  'connectToApp',
  'signatureRequest',
  'onboarding'
];

/** Every page entry, each with one initial chunk of ordinary app modules. */
const healthyPageEntrypoints = (): Record<string, FakeChunk[]> =>
  Object.fromEntries(
    PAGE_ENTRY_NAMES.map(name => [
      name,
      [{ modules: [srcModule(`apps/${name}/index.tsx`)] }]
    ])
  );

describe('AssertSdkFreePageEntries', () => {
  it('accepts page entries whose initial chunks carry no SDK module', () => {
    const { sdkFreePlugin } = loadConfig('chrome', 'production');

    expect(
      runSdkFreeAssertion(sdkFreePlugin, healthyPageEntrypoints())
    ).not.toThrow();
  });

  it.each(['popup', 'connectToApp', 'onboarding'])(
    'rejects casper-js-sdk in the initial chunks of %s',
    name => {
      const { sdkFreePlugin } = loadConfig('chrome', 'production');

      expect(
        runSdkFreeAssertion(sdkFreePlugin, {
          ...healthyPageEntrypoints(),
          [name]: [{ modules: [{ resource: SDK_RESOURCE }] }]
        })
      ).toThrow(new RegExp(`entry "${name}" links casper-js-sdk`));
    }
  );

  // The two pages the SDK is still allowed on. A guard that rejected these would
  // be unfixable without reverting the branch, so the exemption is asserted too.
  it.each(['importAccountWithFile', 'signatureRequest'])(
    'leaves %s free to link it eagerly',
    name => {
      const { sdkFreePlugin } = loadConfig('chrome', 'production');

      expect(
        runSdkFreeAssertion(sdkFreePlugin, {
          ...healthyPageEntrypoints(),
          [name]: [{ modules: [{ resource: SDK_RESOURCE }] }]
        })
      ).not.toThrow();
    }
  );

  it('names the module that pulled it in', () => {
    const { sdkFreePlugin } = loadConfig('chrome', 'production');
    const sdk: FakeModule = { resource: SDK_RESOURCE };
    const issuer = srcModule('libs/services/ledger/ledger.ts');

    expect(
      runSdkFreeAssertion(
        sdkFreePlugin,
        { ...healthyPageEntrypoints(), popup: [{ modules: [sdk] }] },
        new Map([[sdk, issuer]])
      )
    ).toThrow(/src\/libs\/services\/ledger\/ledger\.ts -> casper-js-sdk/);
  });

  it('reports the bare package when the issuer has no resource of its own', () => {
    // A concatenated issuer: still a violation, just one webpack cannot attribute.
    const { sdkFreePlugin } = loadConfig('chrome', 'production');
    const sdk: FakeModule = { resource: SDK_RESOURCE };

    expect(
      runSdkFreeAssertion(
        sdkFreePlugin,
        { ...healthyPageEntrypoints(), popup: [{ modules: [sdk] }] },
        new Map([[sdk, { modules: [] }]])
      )
    ).toThrow(/via:\n {2}casper-js-sdk\n/);
  });

  it('finds it inside a ConcatenatedModule', () => {
    // Concatenation runs in production builds only, which is where the guard has
    // to work; a walk that stopped at the wrapper would see nothing there.
    const { sdkFreePlugin } = loadConfig('chrome', 'production');

    expect(
      runSdkFreeAssertion(sdkFreePlugin, {
        ...healthyPageEntrypoints(),
        popup: [
          {
            modules: [
              {
                modules: [
                  srcModule('apps/popup/index.tsx'),
                  { resource: SDK_RESOURCE }
                ]
              }
            ]
          }
        ]
      })
    ).toThrow(/entry "popup" links casper-js-sdk/);
  });

  it('rejects an entry the build did not emit at all', () => {
    const { sdkFreePlugin } = loadConfig('chrome', 'production');
    const entrypoints = healthyPageEntrypoints();
    delete entrypoints.onboarding;

    expect(runSdkFreeAssertion(sdkFreePlugin, entrypoints)).toThrow(
      /emitted no entry "onboarding"/
    );
  });
});

describe('optimization.splitChunks predicate', () => {
  it.each(['background', 'contentScript', 'sdk'])(
    'refuses to split the initial chunk of %s',
    name => {
      const { splitChunksPredicate } = loadConfig('chrome', 'production');

      expect(splitChunksPredicate({ name, canBeInitial: () => true })).toBe(
        false
      );
    }
  );

  it.each([
    'popup',
    'importAccountWithFile',
    'connectToApp',
    'signatureRequest',
    'onboarding'
  ])('splits the initial chunk of %s', name => {
    const { splitChunksPredicate } = loadConfig('chrome', 'production');

    expect(splitChunksPredicate({ name, canBeInitial: () => true })).toBe(true);
  });

  it('keeps the webpack async default for dynamic-import chunks', () => {
    const { splitChunksPredicate } = loadConfig('chrome', 'production');

    expect(
      splitChunksPredicate({ name: '417', canBeInitial: () => false })
    ).toBe(true);
  });

  it('applies in development too, so the dev graph matches what ships', () => {
    const { splitChunksPredicate } = loadConfig('chrome', 'development');

    expect(
      splitChunksPredicate({ name: 'background', canBeInitial: () => true })
    ).toBe(false);
    expect(
      splitChunksPredicate({ name: 'popup', canBeInitial: () => true })
    ).toBe(true);
  });
});

/**
 * `sideEffects` declares every module under src/ side-effect-free unless listed,
 * letting webpack drop a bare `import './x'` whose exports are unused. Nothing
 * else ties the list to the imports it governs — an omission is invisible to
 * format, lint, tsc, knip and the suite, and surfaces only in a production
 * bundle, as a popup rendering raw translation keys because i18next never
 * initialised. Enumerated from disk so the next bare import is covered too.
 */
describe('package.json sideEffects', () => {
  const SRC = path.join(ROOT, 'src');

  const aliases: Record<string, string> = Object.fromEntries(
    Object.entries(
      tsconfig.compilerOptions.paths as Record<string, string[]>
    ).map(([pattern, [target]]) => [
      pattern.replace(/\/\*$/, ''),
      path.join(ROOT, target.replace(/^\.\//, '').replace(/\/\*$/, ''))
    ])
  );

  const sourceFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return sourceFiles(full);
      }

      return /\.tsx?$/.test(entry.name) ? [full] : [];
    });

  /** Resolves an import specifier to a file inside src/, or null. */
  const resolveSpecifier = (specifier: string, importer: string) => {
    let base: string | null = null;

    if (specifier.startsWith('.')) {
      base = path.resolve(path.dirname(importer), specifier);
    } else {
      const alias = Object.keys(aliases).find(
        prefix => specifier === prefix || specifier.startsWith(`${prefix}/`)
      );

      if (alias) {
        base = path.join(aliases[alias], specifier.slice(alias.length));
      }
    }

    if (base === null) {
      return null;
    }

    const candidates = [
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, 'index.ts'),
      path.join(base, 'index.tsx')
    ];

    return candidates.find(candidate => fs.existsSync(candidate)) ?? null;
  };

  const bareImports = sourceFiles(SRC).flatMap(file => {
    const source = fs.readFileSync(file, 'utf8');
    const matches = [...source.matchAll(/^import\s+'([^']+)';/gm)];

    return matches
      .map(match => resolveSpecifier(match[1], file))
      .filter((resolved): resolved is string => resolved !== null)
      .map(
        resolved =>
          `./${path.relative(ROOT, resolved).split(path.sep).join('/')}`
      );
  });

  it('finds the bare imports it is meant to check', () => {
    // A scan that matched nothing would turn the assertion below into a pass.
    expect(bareImports.length).toBeGreaterThanOrEqual(4);
  });

  it.each([...new Set(bareImports)])(
    '%s is declared side-effectful',
    resolved => {
      expect(pkg.sideEffects).toContain(resolved);
    }
  );
});
