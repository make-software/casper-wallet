const { execSync, execFileSync } = require('child_process');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

const config = require('../webpack.config');
const env = require('./env');
const { isChrome, isFirefox, ExtensionBuildPath } = require('../constants');

const { getExtensionBuildAbsolutePath } = require('./build-dir-utils');

const chromeExtensionID = 'aohghmighlieiainnegkcijnfilokake';

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

const compiler = webpack(config);
const publicPath = `http://localhost:${env.PORT}/`;

const server = new WebpackDevServer(
  {
    hot: false, // Prevents infinite reloading after changes
    liveReload: false, // Prevents infinite reloading after changes
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
  } else {
    throw new Error("Unknown browser passed. Couldn't start browser");
  }
})();
