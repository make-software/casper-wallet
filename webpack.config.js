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

const commitHash = resolveCommitHash({ root: __dirname, isDev });

const ASSET_PATH = process.env.ASSET_PATH || '/';
const buildDir = isChrome
  ? ExtensionBuildPath.Chrome
  : isSafari
    ? ExtensionBuildPath.Safari
    : ExtensionBuildPath.Firefox;

const alias = {};

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

// One nonce per build, and ONLY for Chrome production — the sole CSP arm that pins
// style-src. A random literal elsewhere breaks the byte-for-byte rebuild AMO review does.
const CSP_NONCE =
  isChrome && !isDev ? crypto.randomBytes(16).toString('base64') : null;

const getCSP = () => {
  // Inline style ATTRIBUTES stay allowed because React's `style={{…}}` props and
  // lottie-web / react-loading-skeleton / react-tiny-popover write element.style directly.
  const styleDirectives = CSP_NONCE
    ? `style-src 'self' 'nonce-${CSP_NONCE}'; style-src-attr 'unsafe-inline'`
    : "style-src 'self' 'unsafe-inline'";
  // `baseDirectives` and `connectSrc` are shared with the Safari runtime <meta> policy
  // in src/utils.ts. Only the style arm differs per target, so it stays here.
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
// bundles it has to check by looking for this exact path in webpack's normalized entry.
const NONCE_SETTER = path.join(__dirname, 'src', 'set-webpack-nonce.ts');

// HMR registers each rebuild's hot-update chunk as a file of the chunk it patches;
// nothing loads those as part of the entry, so the assertions below must skip them.
const isBundleJs = file =>
  file.endsWith('.js') && !file.includes('.hot-update.');

// Split by how the browser loads them: a PAGE entry is an HTML page that can also load
// a hoisted chunk; a SINGLE_FILE entry is loaded as one file by the manifest.
const PAGE_ENTRY_NAMES = [
  'popup',
  'importAccountWithFile',
  'connectToApp',
  'signatureRequest',
  'onboarding'
];
const SINGLE_FILE_ENTRY_NAMES = ['background', 'contentScript', 'sdk'];

// Drift between the manifest's nonce and the bundles' is silent — every app renders
// unstyled with the build green — so check the emitted assets, before afterEmit voids them.
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

  // Not a hard-coded list: the guarded set is whichever entries webpack was actually
  // given the nonce setter for.
  for (const [name, entry] of Object.entries(compiler.options.entry)) {
    if (!(entry.import ?? []).includes(NONCE_SETTER)) {
      continue;
    }

    // "at least one file", not "every file": only the chunk holding set-webpack-nonce
    // carries the substituted literal.
    const carriesNonce = compilation.entrypoints
      .get(name)
      .getFiles()
      .filter(isBundleJs)
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

// Each single-file entry must emit exactly one JS file — if splitChunks ever reaches
// one, the build fails here instead of the service worker failing to boot.
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
    const files = entrypoint.getFiles().filter(isBundleJs);

    if (files.length !== 1) {
      throw new Error(
        `Single-file entry check: entry "${name}" emitted ${files.length} JS files (${files.join(', ')}), expected exactly 1. Nothing loads a second file for that entry, so those modules would be missing at runtime.`
      );
    }

    // No async chunks either — jsonp loading from publicPath '/' resolves in neither
    // context. To let the worker load chunks, give it `chunkLoading: 'import-scripts'`.
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
    files.push(...child.getFiles().filter(isBundleJs));
    files.push(...collectAsyncFiles(child, seen));
  }

  return files;
};

// casper-js-sdk is a prebuilt UMD blob with no ESM build, so one value import costs
// ~900 KB no bundler can shake out, parsed on every open of the page that links it.
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

// A ConcatenatedModule has no `resource` of its own — its merged modules hang off
// `.modules`, and concatenation is what production builds do.
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

    // Initial chunks only — a chunk behind a dynamic import is the intended fix.
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
    // Prepended as an array entry rather than imported: webpack runs array-entry modules
    // in order before the rest of the graph, so __webpack_nonce__ precedes any CSS.
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
    notHotReload: ['background', 'contentScript', 'devtools', 'sdk'] // Prevents infinite reloading after changes
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
        loader: 'base64-loader',
        // Makes WebPack think it is not WebAssembly — otherwise: "WebAssembly module
        // is included in initial chunk."
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
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.MOCK_STATE': JSON.stringify(process.env.MOCK_STATE),
      'process.env.BROWSER': JSON.stringify(process.env.BROWSER),
      'process.env.TEST_ENV': JSON.stringify(process.env.TEST_ENV),
      // A dedicated global because ProcessEnv cannot express the `null`. Defined for
      // EVERY target: an unreplaced free variable throws ReferenceError at runtime.
      __CSP_NONCE__: JSON.stringify(CSP_NONCE)
    }),
    new AssertCspNonceIntegrity(),
    new AssertSingleFileEntries(),
    new AssertSdkFreePageEntries(),
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
            const manifest = {
              ...JSON.parse(content.toString()),
              name: pkg.name,
              version: pkg.version,
              version_name: pkg.version + ` (${commitHash.slice(0, 7)})`,
              author: pkg.author,
              description: pkg.description,
              content_security_policy: getCSP()
            };
            // The key pins the dev extension id; a published build must not carry it.
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
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/locales',
          to: path.join(__dirname, buildDir, 'locales'),
          force: true
        }
      ]
    }),
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

// An entry in `entry` but in neither list would quietly keep a private copy of every
// shared dependency, so refuse to build instead.
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
  splitChunks: {
    // Not 'all': that would also split the single-file entries, which cannot load a
    // second chunk. `!chunk.canBeInitial()` keeps webpack's default for async chunks.
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
