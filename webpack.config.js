const webpack = require('webpack'),
  path = require('path'),
  crypto = require('crypto'),
  fileSystem = require('fs-extra'),
  env = require('./utils/env'),
  pkg = require('./package.json'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin'),
  TsconfigPaths = require('tsconfig-paths-webpack-plugin'),
  Dotenv = require('dotenv-webpack'),
  { resolveCommitHash } = require('./utils/commit-hash');

const htmlWebpackPluginOptions = {
  cache: false,
  showErrors: true,
  minify: false
};

const htmlLoaderOptions = {
  sources: false
};

const {
  isChrome,
  isSafari,
  ExtensionBuildPath,
  ManifestPath,
  isFirefox
} = require('./constants');

const cspConfig = require('./src/csp.json');

const isDev = env.NODE_ENV === 'development';

// Stamped into manifest.version_name below. Must be derivable without `.git`,
// which the source package reviewers rebuild from does not carry.
const commitHash = resolveCommitHash({ root: __dirname, isDev });

const ASSET_PATH = process.env.ASSET_PATH || '/';
const buildDir = isChrome
  ? ExtensionBuildPath.Chrome
  : ExtensionBuildPath.Firefox;

const alias = {};

// load the secrets
const secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

const fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'ttf',
  'svg',
  'woff',
  'woff2'
];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

// One nonce per build, and ONLY for Chrome production — that is the sole CSP arm
// that pins style-src to it (see getCSP below). Emitting a random literal into
// Firefox/Safari bundles that never read it makes those builds irreproducible,
// which AMO source review requires (it rebuilds and compares byte-for-byte).
// Where it does apply, the same value is wired to __webpack_nonce__ (style-loader)
// and __CSP_NONCE__ (styled-components' CspStyleSheetManager) below, so the
// manifest CSP and the injected <style> tags always match.
//
// This is the ONLY place the Chrome-production predicate is spelled out: getCSP()
// and the DefinePlugin literal both derive from the value, never re-derive the
// condition. A second copy could drift and emit `'nonce-null'` — syntactically
// valid, matched by nothing, blocking every stylesheet in all five apps.
const CSP_NONCE =
  isChrome && !isDev ? crypto.randomBytes(16).toString('base64') : null;

const getCSP = () => {
  // Chrome-production locks <style>/<link> ELEMENTS to the build nonce (style-src,
  // via which style-src-elem falls back) so an injected stylesheet is blocked, while
  // keeping inline style ATTRIBUTES / element.style writes allowed via style-src-attr.
  // The latter is unavoidable: React applies every `style={{…}}` prop and lottie-web /
  // react-loading-skeleton / react-tiny-popover mutate element.style at runtime, all of
  // which the CSP treats as "applying inline style" — a nonce cannot cover them. Dev,
  // Firefox and Safari keep 'unsafe-inline' plus 'self' so packaged stylesheets (fonts.css) still load.
  const styleDirectives = CSP_NONCE
    ? `style-src 'self' 'nonce-${CSP_NONCE}'; style-src-attr 'unsafe-inline'`
    : "style-src 'self' 'unsafe-inline'";
  // `baseDirectives` (which now also carries img-src/media-src) and `connectSrc`
  // are shared with the Safari runtime <meta> policy in src/utils.ts — see
  // src/csp.json. Only the style arm differs per target, so it stays here.
  const csp = `${cspConfig.baseDirectives}; ${styleDirectives}; connect-src ${cspConfig.connectSrc.join(' ')}`;

  if (isFirefox) {
    return csp;
  }

  if (isChrome) {
    return isDev
      ? {
          extension_pages: `${csp} https://api.bringweb3.io/ https://sandbox-api.bringweb3.io/ ws://localhost:8000/socketcluster/ ws://localhost:3001/ws`
        }
      : {
          extension_pages: `${csp} https://api.bringweb3.io/ https://sandbox-api.bringweb3.io/`
        };
  }
};

// Single source for the nonce-setter entry: the emit-time assertion below finds the
// bundles it has to check by looking for this exact path in webpack's normalized
// entry, so the list of guarded bundles cannot drift from the list that actually gets
// the setter prepended.
const NONCE_SETTER = path.join(__dirname, 'src', 'set-webpack-nonce.ts');

// The two kinds of entry this config produces, split by how the browser loads them.
//
// PAGE entries are HTML pages. Each gets a <script> per file from
// HtmlWebpackPlugin, so webpack may hoist a module several of them share into a
// separate chunk that every page loads alongside its own bundle — which is what
// optimization.splitChunks below does.
//
// SINGLE_FILE entries cannot do that. The MV3 service worker is registered as one
// file and the two content scripts are injected as one file each by the manifest;
// nothing loads a sibling chunk for them. A module hoisted out of one would just
// be missing at runtime, in a context with no page to report it.
const PAGE_ENTRY_NAMES = [
  'popup',
  'importAccountWithFile',
  'connectToApp',
  'signatureRequest',
  'onboarding'
];
const SINGLE_FILE_ENTRY_NAMES = ['background', 'contentScript', 'sdk'];

// The manifest CSP and the bundles receive the nonce through two different plugins
// (CopyWebpackPlugin's manifest transform and DefinePlugin), so "the two agree" holds
// only for as long as both keep deriving from CSP_NONCE. WALLET-1388 is what it looks
// like when they stop: an ambient CSP_NONCE reached the bundles through
// dotenv-webpack's `systemvars` while the manifest kept the generated value. The build
// succeeded, the manifest looked right, and the extension rendered completely unstyled.
//
// Routing the value through __CSP_NONCE__ instead of process.env closed that particular
// hole — dotenv-webpack only ever defines `process.env.*` keys — but the failure mode is
// silent by nature, and the next source of drift will not announce itself either. So
// this checks the artifacts rather than the intent: whatever the built manifest pins
// must be exactly what this build generated, and exactly what every bundle carrying the
// nonce setter contains.
//
// It runs on the last processAssets stage — after CopyWebpackPlugin has added the
// manifest (it emits at PROCESS_ASSETS_STAGE_ADDITIONAL) and while asset sources are
// still readable. afterEmit is too late: webpack swaps every emitted source for a
// SizeOnlySource, and reading one throws. Working from the compilation rather than from
// disk also keeps this working under webpack-dev-server, which never writes files.
//
// Throwing rejects the build rather than logging: tapable forwards the exception to the
// seal callback, webpack hands it to the compiler callback as a fatal error, and
// utils/build.js rethrows it — a non-zero exit. Pushing to compilation.errors would not
// do that, since utils/build.js never inspects stats.
class AssertCspNonceIntegrity {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      'AssertCspNonceIntegrity',
      compilation => {
        compilation.hooks.processAssets.tap(
          {
            name: 'AssertCspNonceIntegrity',
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
          },
          () => assertNonceIntegrity(compiler, compilation)
        );
      }
    );
  }
}

const assertNonceIntegrity = (compiler, compilation) => {
  const manifestAsset = compilation.getAsset('manifest.json');

  if (!manifestAsset) {
    throw new Error('CSP nonce check: the build emitted no manifest.json.');
  }

  const manifest = JSON.parse(manifestAsset.source.source().toString());
  const csp =
    typeof manifest.content_security_policy === 'string'
      ? manifest.content_security_policy
      : (manifest.content_security_policy?.extension_pages ?? '');
  const pinned = csp.match(/'nonce-([^']*)'/)?.[1] ?? null;

  if (pinned !== CSP_NONCE) {
    throw new Error(
      `CSP nonce check: the manifest pins ${JSON.stringify(pinned)}, but this build generated ${JSON.stringify(CSP_NONCE)}. Every injected stylesheet would be blocked.`
    );
  }

  if (pinned === null) {
    return;
  }

  // Not a hard-coded list of app entries: the guarded set is whichever entries webpack
  // was actually given the nonce setter for, read back from the normalized entry.
  for (const [name, entry] of Object.entries(compiler.options.entry)) {
    if (!(entry.import ?? []).includes(NONCE_SETTER)) {
      continue;
    }

    // "at least one file", not "every file": an entrypoint can emit a runtime chunk
    // alongside its main bundle, and only the chunk holding set-webpack-nonce carries
    // the substituted literal.
    const carriesNonce = compilation.entrypoints
      .get(name)
      .getFiles()
      .filter(file => file.endsWith('.js'))
      .some(file =>
        compilation.getAsset(file)?.source.source().toString().includes(pinned)
      );

    if (!carriesNonce) {
      throw new Error(
        `CSP nonce check: the manifest pins ${JSON.stringify(pinned)}, but no bundle of entry "${name}" contains it. That entry's stylesheets would be blocked.`
      );
    }
  }
};

// Same argument as the nonce assertion above, one layer earlier: rather than trust
// that the splitChunks predicate still names the right chunks, check the artifact.
// Each single-file entry must still emit exactly one JS file — if splitChunks ever
// reaches one, the build fails here instead of the service worker failing to boot.
class AssertSingleFileEntries {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      'AssertSingleFileEntries',
      compilation => {
        compilation.hooks.processAssets.tap(
          {
            name: 'AssertSingleFileEntries',
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
          },
          () => assertSingleFileEntries(compilation)
        );
      }
    );
  }
}

const assertSingleFileEntries = compilation => {
  for (const name of SINGLE_FILE_ENTRY_NAMES) {
    const entrypoint = compilation.entrypoints.get(name);

    if (!entrypoint) {
      throw new Error(
        `Single-file entry check: the build emitted no entry "${name}".`
      );
    }

    // Initial files only — chunks behind a dynamic import are checked below.
    const files = entrypoint.getFiles().filter(file => file.endsWith('.js'));

    if (files.length !== 1) {
      throw new Error(
        `Single-file entry check: entry "${name}" emitted ${files.length} JS files (${files.join(', ')}), expected exactly 1. Nothing loads a second file for that entry, so those modules would be missing at runtime.`
      );
    }

    // No async chunks either. With no `target` set, loading defaults to jsonp,
    // and publicPath is '/': a content script would fetch the chunk from the
    // visited site's origin and the callback would land in the page world,
    // where the isolated world's promise never settles. The service worker has
    // no document to append a <script> to at all.
    //
    // Nothing emits one today. To let the worker load chunks, set
    // `chunkLoading: 'import-scripts'` on that entry first, then exempt it here.
    const asyncFiles = collectAsyncFiles(entrypoint);

    if (asyncFiles.length > 0) {
      throw new Error(
        `Single-file entry check: entry "${name}" emitted ${asyncFiles.length} async chunk(s) (${asyncFiles.join(', ')}). Nothing can load a chunk for that entry: a content script would fetch it from the visited page's origin and its jsonp callback would never reach this world, and the service worker has no document to load it with. Import the module statically, or use webpackMode "eager".`
      );
    }
  }
};

// Transitive: a dynamic import inside a dynamically imported module is still an
// async chunk of this entry.
const collectAsyncFiles = (group, seen = new Set()) => {
  const files = [];

  for (const child of group.getChildren()) {
    if (seen.has(child)) {
      continue;
    }

    seen.add(child);
    files.push(...child.getFiles().filter(file => file.endsWith('.js')));
    files.push(...collectAsyncFiles(child, seen));
  }

  return files;
};

// casper-js-sdk is a prebuilt UMD blob with no ESM build, so one value import
// costs ~900 KB no bundler can shake out — parsed on every popup open
// (WALLET-1381). Whether it stays out turns on which *names* eagerly-reached
// modules pull from the @libs/ui/components barrel: `NoConnectedLedger` re-links
// it through @libs/services/ledger, and nothing else would fail. Hence a
// tripwire rather than a one-off measurement.
//
// Not every page entry: importAccountWithFile and signatureRequest still link it
// eagerly. Add one here once it is cleaned up.
const SDK_FREE_PAGE_ENTRY_NAMES = ['popup', 'connectToApp', 'onboarding'];
const CASPER_SDK_RESOURCE = /node_modules[\\/]casper-js-sdk[\\/]/;

class AssertSdkFreePageEntries {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      'AssertSdkFreePageEntries',
      compilation => {
        compilation.hooks.processAssets.tap(
          {
            name: 'AssertSdkFreePageEntries',
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
          },
          () => assertSdkFreePageEntries(compilation)
        );
      }
    );
  }
}

// A ConcatenatedModule has no `resource` of its own — its merged modules hang
// off `.modules`. Missing that would blind the check in production builds,
// which is where concatenation runs.
const resourcesOf = module =>
  module.modules?.length
    ? module.modules.flatMap(resourcesOf)
    : [module.resource].filter(Boolean);

const assertSdkFreePageEntries = compilation => {
  for (const name of SDK_FREE_PAGE_ENTRY_NAMES) {
    const entrypoint = compilation.entrypoints.get(name);

    if (!entrypoint) {
      throw new Error(
        `SDK-free entry check: the build emitted no entry "${name}".`
      );
    }

    const offenders = new Set();

    // Initial chunks only: the entry's own plus any split chunk the page loads
    // with it. Chunks behind a dynamic import are the intended fix, not a
    // violation.
    for (const chunk of entrypoint.chunks) {
      for (const module of compilation.chunkGraph.getChunkModulesIterable(
        chunk
      )) {
        if (!resourcesOf(module).some(r => CASPER_SDK_RESOURCE.test(r))) {
          continue;
        }

        const issuer = compilation.moduleGraph.getIssuer(module);
        offenders.add(
          issuer?.resource
            ? `${path.relative(__dirname, issuer.resource)} -> casper-js-sdk`
            : 'casper-js-sdk'
        );
      }
    }

    if (offenders.size > 0) {
      throw new Error(
        `SDK-free entry check: entry "${name}" links casper-js-sdk into its initial chunks via:\n  ${[...offenders].join('\n  ')}\nThat is ~900 KB parsed on every open of this page. Import the SDK behind a dynamic import at a service boundary, or use a type-only import if you only need its types.`
      );
    }
  }
};

const options = {
  experiments: {
    topLevelAwait: true
  },
  mode: process.env.NODE_ENV || 'development',
  entry: {
    // The nonce-setter is prepended as an array entry, not imported from inside
    // each entry file: webpack executes array-entry modules strictly in order
    // before the rest of the entry's module graph, so __webpack_nonce__ is set
    // before any CSS (style-loader/styled-components) is evaluated. A source-level
    // import can't guarantee this — prettier's import-sort would order it after
    // the css imports in some entries.
    popup: [
      NONCE_SETTER,
      path.join(__dirname, 'src', 'apps', 'popup', 'index.tsx')
    ],
    importAccountWithFile: [
      NONCE_SETTER,
      path.join(
        __dirname,
        'src',
        'apps',
        'import-account-with-file',
        'index.tsx'
      )
    ],
    connectToApp: [
      NONCE_SETTER,
      path.join(__dirname, 'src', 'apps', 'connect-to-app', 'index.tsx')
    ],
    signatureRequest: [
      NONCE_SETTER,
      path.join(__dirname, 'src', 'apps', 'signature-request', 'index.tsx')
    ],
    onboarding: [
      NONCE_SETTER,
      path.join(__dirname, 'src', 'apps', 'onboarding', 'index.tsx')
    ],
    background: path.join(__dirname, 'src', 'background', 'index.ts'),
    contentScript: path.join(__dirname, 'src', 'content', 'index.ts'),
    sdk: path.join(__dirname, 'src', 'content', 'sdk.ts')
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['background', 'contentScript', 'devtools', 'sdk'] // Probably can be improved. Background and sdk were added to prevent infinite reloading after changes
  },
  output: {
    path: path.resolve(__dirname, buildDir),
    filename: '[name].bundle.js',
    clean: true,
    publicPath: ASSET_PATH
  },
  module: {
    noParse: /\.wasm$/,
    rules: [
      {
        test: /\.wasm$/,
        // Tells WebPack that this module should be included as
        // base64-encoded binary file and not as code
        loader: 'base64-loader',
        // Disables WebPack's opinion where WebAssembly should be,
        // makes it think that it's not WebAssembly
        //
        // Error: WebAssembly module is included in initial chunk.
        type: 'javascript/auto'
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        type: 'asset/resource',
        generator: { filename: '[name][ext]' },
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        options: htmlLoaderOptions,
        exclude: /node_modules/
      },
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules\/(?!(casper-wallet-core)\/).*/,
        options: { allowTsInNodeModules: true }
      }
    ]
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map(extension => '.' + extension)
      .concat(['.js', '.jsx', '.ts', '.tsx']),
    plugins: [new TsconfigPaths.TsconfigPathsPlugin({})],
    fallback: {
      path: false,
      fs: false,
      Buffer: false,
      process: false
    }
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new Dotenv({
      systemvars: true
    }),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.MOCK_STATE': JSON.stringify(process.env.MOCK_STATE),
      'process.env.BROWSER': JSON.stringify(process.env.BROWSER),
      'process.env.TEST_ENV': JSON.stringify(process.env.TEST_ENV),
      // Not routed through process.env: @types/node types every ProcessEnv member
      // as `string | undefined`, which cannot express the `null` substituted on
      // non-Chrome targets. A dedicated global is declared as `string | null`
      // (src/@types/custom.d.ts), so the null-handling at each reader is enforced
      // by tsc instead of being a convention nothing can check.
      // The key stays defined for EVERY target on purpose — dropping it would
      // leave the free variable unreplaced and throw ReferenceError at runtime.
      __CSP_NONCE__: JSON.stringify(CSP_NONCE)
    }),
    // Guards the two consumers above and below against drifting apart. Runs on
    // afterEmit, so registration order here does not matter.
    new AssertCspNonceIntegrity(),
    new AssertSingleFileEntries(),
    new AssertSdkFreePageEntries(),
    // manifest file generation
    new CopyWebpackPlugin({
      patterns: [
        {
          from: isChrome
            ? ManifestPath.v3
            : isSafari
              ? ManifestPath.v2_Safari
              : ManifestPath.v2,
          to: path.join(__dirname, buildDir, 'manifest.json'),
          force: true,
          transform: function (content) {
            // generates the manifest file using the package.json informations
            const manifest = {
              ...JSON.parse(content.toString()),
              name: pkg.name,
              version: pkg.version,
              version_name: pkg.version + ` (${commitHash.slice(0, 7)})`,
              author: pkg.author,
              description: pkg.description,
              content_security_policy: getCSP()
            };
            // Removing the key from manifest for Chrome production build
            if (isChrome && !isDev) {
              delete manifest.key;
            }

            return Buffer.from(JSON.stringify(manifest));
          }
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/declarative_net_request_rules.json',
          to: path.join(
            __dirname,
            buildDir,
            'declarative_net_request_rules.json'
          ),
          force: true
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img/logo16.png',
          to: path.join(__dirname, buildDir),
          force: true
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img/logo64.png',
          to: path.join(__dirname, buildDir),
          force: true
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img/logo128.png',
          to: path.join(__dirname, buildDir),
          force: true
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img/logo192.png',
          to: path.join(__dirname, buildDir),
          force: true
        }
      ]
    }),
    // copy locales
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/locales',
          to: path.join(__dirname, buildDir, 'locales'),
          force: true
        }
      ]
    }),
    // copy assets
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/fonts',
          to: path.join(__dirname, buildDir, 'assets/fonts'),
          force: true
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/icons',
          to: path.join(__dirname, buildDir, 'assets/icons'),
          force: true
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/illustrations',
          to: path.join(__dirname, buildDir, 'assets/illustrations'),
          force: true
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'apps', 'popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
      ...htmlWebpackPluginOptions
    }),
    new HtmlWebpackPlugin({
      template: path.join(
        __dirname,
        'src',
        'apps',
        'import-account-with-file',
        'index.html'
      ),
      filename: 'import-account-with-file.html',
      chunks: ['importAccountWithFile'],
      ...htmlWebpackPluginOptions
    }),
    new HtmlWebpackPlugin({
      template: path.join(
        __dirname,
        'src',
        'apps',
        'connect-to-app',
        'index.html'
      ),
      filename: 'connect-to-app.html',
      chunks: ['connectToApp'],
      ...htmlWebpackPluginOptions
    }),
    new HtmlWebpackPlugin({
      template: path.join(
        __dirname,
        'src',
        'apps',
        'signature-request',
        'index.html'
      ),
      filename: 'signature-request.html',
      chunks: ['signatureRequest'],
      ...htmlWebpackPluginOptions
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'apps', 'onboarding', 'index.html'),
      filename: 'onboarding.html',
      chunks: ['onboarding'],
      ...htmlWebpackPluginOptions
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ],
  infrastructureLogging: {
    level: 'info'
  }
};

// Both lists above are hand-written, and splitChunks only opts in what PAGE_ENTRY_NAMES
// names. An entry added to `entry` but to neither list would quietly keep a private copy
// of everything — the exact thing this config exists to stop — so refuse to build instead.
const unclassifiedEntries = Object.keys(options.entry).filter(
  name =>
    !PAGE_ENTRY_NAMES.includes(name) && !SINGLE_FILE_ENTRY_NAMES.includes(name)
);

if (unclassifiedEntries.length > 0) {
  throw new Error(
    `Entry ${unclassifiedEntries.map(name => `"${name}"`).join(', ')} is in neither PAGE_ENTRY_NAMES nor SINGLE_FILE_ENTRY_NAMES. Add it to whichever describes how the browser loads it — see the comment on those lists.`
  );
}

options.optimization = {
  // Before this, every entry bundled its own private copy of every shared dependency:
  // casper-js-sdk alone shipped eight times over (7.3 MB of an 18 MB package), react-dom
  // five times. Hoisting what the page entries share into chunks they all load removes
  // the duplicates without changing what any page can reach (WALLET-1380).
  splitChunks: {
    // Not 'all'. That would also split the single-file entries, which cannot load a
    // second chunk — see PAGE_ENTRY_NAMES / SINGLE_FILE_ENTRY_NAMES above, and
    // AssertSingleFileEntries, which fails the build if this predicate stops holding.
    //
    // `!chunk.canBeInitial()` keeps webpack's default treatment of chunks created by a
    // dynamic import (the built-in default is `chunks: 'async'`, which this replaces
    // wholesale): they are loaded on demand by the webpack runtime of whichever entry
    // pulled them in, so they stay splittable whatever their parent entry is.
    chunks: chunk =>
      PAGE_ENTRY_NAMES.includes(chunk.name) || !chunk.canBeInitial()
  }
};

if (isDev) {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization.minimize = true;
  options.optimization.minimizer = [
    new TerserPlugin({
      extractComments: false,
      terserOptions: {
        safari10: true
      }
    })
  ];
}

// Bundle size report — strictly opt-in, zero footprint unless ANALYZE=true.
// `npm run build:analyze` sets it; never enabled by normal build/dev/start scripts.
if (process.env.ANALYZE === 'true') {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  options.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: path.resolve(
        __dirname,
        'analyzer-report',
        `${process.env.BROWSER || 'chrome'}.html`
      )
    })
  );
}

module.exports = options;
