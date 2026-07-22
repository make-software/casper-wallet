const { execSync, execFileSync } = require('child_process');
const XcodeBuildPlugin = require('xcode-build-webpack-plugin');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

const config = require('../webpack.config');
const env = require('./env');
const {
  isChrome,
  isFirefox,
  isSafari,
  ExtensionBuildPath,
  extensionName
} = require('../constants');

const { getExtensionBuildAbsolutePath } = require('./build-dir-utils');

const chromeExtensionID = 'aohghmighlieiainnegkcijnfilokake';

// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

const extensionAbsPath = getExtensionBuildAbsolutePath();
const options = config.chromeExtensionBoilerplate || {};
const excludeEntriesToHotReload = options.notHotReload || [];

for (const entryName in config.entry) {
  if (excludeEntriesToHotReload.indexOf(entryName) === -1) {
    config.entry[entryName] = [
      'webpack/hot/dev-server',
      // webpack-dev-server 6 only exports "./client/*", so the entry must point at index.js explicitly
      `webpack-dev-server/client/index.js?hot=true&hostname=localhost&port=${env.PORT}`
    ].concat(config.entry[entryName]);
  }
}

config.plugins = [new webpack.HotModuleReplacementPlugin()].concat(
  config.plugins || []
);

delete config.chromeExtensionBoilerplate;

if (isSafari) {
  config.plugins.push(
    new XcodeBuildPlugin({
      projectDir: extensionAbsPath,
      args: {
        quiet: true,
        scheme: extensionName
      },
      buildActions: 'build'
    })
  );
}

const compiler = webpack(config);
const publicPath = `http://localhost:${env.PORT}/`;

const server = new WebpackDevServer(
  {
    hot: false, // Probably can be improved. Was added to prevent infinite reloading after changes
    liveReload: false, // Probably can be improved. Was added to prevent infinite reloading after changes
    // DEP-99/WALLET-1343: evaluated extension auto-reload-on-rebuild (webpack-ext-reloader /
    // a custom chrome.runtime.reload() signal) and cut it — it either re-enables the exact
    // infinite-reload failure mode the two flags above guard against, or (webpack-ext-reloader)
    // pulls in 5+ extra deps (lodash, ws, json5, webpack-sources, useragent) and forces
    // background/contentScript into a hot-reload entry list they're deliberately excluded from.
    // Not cheap/clean per plan Step 2 — deferred, not implemented. Reload the extension manually
    // from chrome://extensions (or about:debugging) after a rebuild.
    client: {
      overlay: false
    },
    host: 'localhost',
    port: env.PORT,
    static: {
      directory: extensionAbsPath
    },
    devMiddleware: {
      publicPath,
      writeToDisk: true
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    allowedHosts: 'all'
  },
  compiler
);

if (process.env.NODE_ENV === 'development' && 'hot' in module) {
  module.hot.accept();
}

(async () => {
  await server.start();

  if (isChrome) {
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Pass args as an array (no shell) so the filesystem-derived
    // extension path can't be interpreted as a shell command.
    execFileSync('open', [
      '-na',
      'Google Chrome',
      'chrome://extensions/',
      '--args',
      `--load-extension=${extensionAbsPath}`,
      '--remote-debugging-port=9222'
    ]);
    await delay(2000); // Waiting for install
    execFileSync('open', [
      '-na',
      'Google Chrome',
      `chrome-extension://${chromeExtensionID}/popup.html`,
      '--args',
      '--remote-debugging-port=9222'
    ]);
  } else if (isFirefox) {
    execSync(
      `web-ext run --source-dir ${ExtensionBuildPath.Firefox} -u about:debugging#/runtime/this-firefox`
    );
  } else if (isSafari) {
    // Pass args as an array (no shell) so the PORT-derived public path
    // can't be interpreted as a shell command.
    execFileSync('open', ['-na', 'Safari', `${publicPath}popup.html`]);
  } else {
    throw new Error("Unknown browser passed. Couldn't start browser");
  }
})();
