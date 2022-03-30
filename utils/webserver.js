const { execSync } = require('child_process');
const path = require('path');
const XcodeBuildPlugin = require('xcode-build-webpack-plugin');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

const { buildWebDriver } = require('../e2e/webdriver');
const config = require('../webpack.config');
const env = require('./env');

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

const browser = process.env.BROWSER;

const chromeBuildDir = 'build/chrome';
const safariBuildDir = 'build/safari/CasperLabs Signer';
const firefoxBuildDir = 'build/firefox';

const isSafari = browser === 'safari';
const isChrome = browser === 'chrome';
const isFirefox = browser === 'firefox';

// This script uses only for chrome or safari
// Firefox runs with help `web-ext` library
let directory;
if (isSafari) {
  directory = path.join(__dirname, '../', safariBuildDir);
} else if (isFirefox) {
  directory = path.join(__dirname, '../', firefoxBuildDir);
} else if (isChrome) {
  directory = path.join(__dirname, '../', chromeBuildDir);
} else {
  throw new Error('Unknown browser');
}

const options = config.chromeExtensionBoilerplate || {};
const excludeEntriesToHotReload = options.notHotReload || [];

for (const entryName in config.entry) {
  if (excludeEntriesToHotReload.indexOf(entryName) === -1) {
    config.entry[entryName] = [
      'webpack/hot/dev-server',
      `webpack-dev-server/client?hot=true&hostname=localhost&port=${env.PORT}`
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
      projectDir: safariBuildDir,
      args: {
        quiet: true,
        scheme: 'CasperLabs Signer'
      },
      buildActions: 'build'
    })
  );
}

const compiler = webpack(config);

const server = new WebpackDevServer(
  {
    https: false,
    hot: true,
    client: false,
    host: 'localhost',
    port: env.PORT,
    static: {
      directory
    },
    devMiddleware: {
      publicPath: `http://localhost:${env.PORT}/`,
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
  await server.startCallback(async () => {
    if (!browser || (!isChrome && !isFirefox)) {
      return;
    }

    const driver = await buildWebDriver({ browser });
    await driver.navigate();
  });
})();
