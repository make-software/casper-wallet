const webpack = require('webpack'),
  path = require('path'),
  fileSystem = require('fs-extra'),
  env = require('./utils/env'),
  pkg = require('./package.json'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin'),
  TsconfigPaths = require('tsconfig-paths-webpack-plugin'),
  Dotenv = require('dotenv-webpack');

const commitHash = process.env.HASH || process.env.GITHUB_SHA;
if (!commitHash) {
  throw Error('No commit hash env!');
}

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

const isDev = env.NODE_ENV === 'development';

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

const getCSP = () => {
  const csp =
    "default-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src https: data:; media-src https: data:; connect-src https://event-store-api-clarity-testnet.make.services https://event-store-api-clarity-mainnet.make.services https://casper-assets.s3.amazonaws.com/ https://image-proxy-cdn.make.services/ https://node.cspr.cloud/ https://node.testnet.cspr.cloud/ https://api.testnet.casperwallet.io/ https://api.mainnet.casperwallet.io/ https://onramp-api.cspr.click/api/ https://cspr-wallet-api.dev.make.services/ https://cspr-api-gateway.dev.make.services/cspr-node-proxy-rpc-dev-condor/ https://cspr-wallet-api-condor.dev.make.services/ https://cspr-wallet-api.stg.make.services/ https://api.integration.casperwallet.io/ https://node.integration.cspr.cloud/";

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

const options = {
  experiments: {
    topLevelAwait: true
  },
  mode: process.env.NODE_ENV || 'development',
  entry: {
    popup: path.join(__dirname, 'src', 'apps', 'popup', 'index.tsx'),
    importAccountWithFile: path.join(
      __dirname,
      'src',
      'apps',
      'import-account-with-file',
      'index.tsx'
    ),
    connectToApp: path.join(
      __dirname,
      'src',
      'apps',
      'connect-to-app',
      'index.tsx'
    ),
    signatureRequest: path.join(
      __dirname,
      'src',
      'apps',
      'signature-request',
      'index.tsx'
    ),
    onboarding: path.join(__dirname, 'src', 'apps', 'onboarding', 'index.tsx'),
    background: path.join(__dirname, 'src', 'background', 'index.ts'),
    contentScript: path.join(__dirname, 'src', 'content', 'index.ts'),
    sdk: path.join(__dirname, 'src', 'content', 'sdk.ts')
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['contentScript', 'devtools']
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
        loader: 'file-loader',
        options: {
          name: '[name].[ext]'
        },
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
      },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'source-map-loader'
          },
          {
            loader: 'babel-loader'
          }
        ],
        exclude: /node_modules/
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
      'process.env.TEST_ENV': JSON.stringify(process.env.TEST_ENV)
    }),
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

if (isDev) {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          safari10: true
        }
      })
    ]
  };
}

module.exports = options;
