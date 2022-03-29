const { execSync } = require('child_process');

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

const XcodeBuildPlugin = require('xcode-build-webpack-plugin');
const WebpackDevServer = require('webpack-dev-server'),
  webpack = require('webpack'),
  config = require('../webpack.config'),
  env = require('./env'),
  path = require('path');

const browser = process.env.BROWSER;
const open = process.env.OPEN || false;

const chromeBuildDir = 'build/chrome';
const safariBuildDir = 'build/safari/CasperLabs Signer';

const isSafari = browser === 'safari';

// This script uses only for chrome or safari
// Firefox runs with help `web-ext` library
const directory = isSafari
  ? path.join(__dirname, '../' + safariBuildDir)
  : path.join(__dirname, '../' + chromeBuildDir);

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
      projectDir: './build/safari/CasperLabs Signer',
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
    hot: false,
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
  // @ts-ignore
  module.hot.accept();
}

(async () => {
  await server.startCallback(async () => {
    if (browser !== 'chrome') {
      return;
    }

    const delay = ms => new Promise(res => setTimeout(res, ms));

    const chromeExtensionID = 'aohghmighlieiainnegkcijnfilokake'; // According to `key` in manifest
    const openExtensionPageCommand = `open -a "Google Chrome" chrome-extension://${chromeExtensionID}/popup.html --args --remote-debugging-port=9222`;
    const installExtensionCommand = `open -a "Google Chrome" chrome://extensions/ --args --load-extension=${path.join(
      __dirname,
      '../' + chromeBuildDir
    )} --remote-debugging-port=9222`;

    execSync(installExtensionCommand);
    await delay(2000); // Waiting for install
    execSync(openExtensionPageCommand);
  });
})();
