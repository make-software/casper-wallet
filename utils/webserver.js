const { execSync } = require('child_process');
const path = require('path');
const XcodeBuildPlugin = require('xcode-build-webpack-plugin');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

const { buildWebDriver } = require('../e2e/webdriver');
const config = require('../webpack.config');
const env = require('./env');
const {
  browserEnvVar,
  isChrome,
  isFirefox,
  isSafari,
  ExtensionBuildPath,
  extensionName
} = require('../constants');

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

let directory;
if (isSafari) {
  directory = path.join(__dirname, '../', ExtensionBuildPath.Safari);
} else if (isFirefox) {
  directory = path.join(__dirname, '../', ExtensionBuildPath.Firefox);
} else if (isChrome) {
  directory = path.join(__dirname, '../', ExtensionBuildPath.Firefox);
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
      projectDir: directory,
      args: {
        quiet: true,
        scheme: extensionName
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
    if (!browserEnvVar || (!isChrome && !isFirefox)) {
      return;
    }

    const driver = await buildWebDriver({ browser: browserEnvVar });
    await driver.navigate();
  });
})();
