const webpack = require('webpack');

const { NODE_ENV } = require('./env');
const config = require('../webpack.config');

const { cleanUpBuildDir } = require('./build-dir-utils');

process.env.ASSET_PATH = '/';

delete config.chromeExtensionBoilerplate;

config.mode = NODE_ENV || 'development';

cleanUpBuildDir();
webpack(config, function (err) {
  if (err) throw err;
});
