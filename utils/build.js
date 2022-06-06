const webpack = require('webpack');

const { NODE_ENV, BROWSER } = require('./env');
const config = require('../webpack.config');

const { cleanUpBuildDir } = require('./build-dir-utils');

// Do this as the first thing so that any code reading it knows the right env.
process.env.ASSET_PATH = '/';

delete config.chromeExtensionBoilerplate;

config.mode = NODE_ENV || 'development';

cleanUpBuildDir();
webpack(config, function (err) {
  if (err) throw err;
});
