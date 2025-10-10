const { execSync } = require('child_process');
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
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

const extensionAbsPath = getExtensionBuildAbsolutePath();
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
    hot: true,
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

    const openExtensionPageCommand = `open -na "Google Chrome" chrome-extension://${chromeExtensionID}/popup.html --args --remote-debugging-port=9222`;
    const installExtensionCommand = `open -na "Google Chrome" chrome://extensions/ --args --load-extension=${extensionAbsPath} --remote-debugging-port=9222`;

    execSync(installExtensionCommand);
    await delay(2000); // Waiting for install
    execSync(openExtensionPageCommand);
  } else if (isFirefox) {
    execSync(
      `web-ext run --source-dir ${ExtensionBuildPath.Firefox} -u about:debugging#/runtime/this-firefox`
    );
  } else if (isSafari) {
    execSync(`open -na Safari ${publicPath}popup.html`);
  } else {
    throw new Error("Unknown browser passed. Couldn't start browser");
  }
})();
