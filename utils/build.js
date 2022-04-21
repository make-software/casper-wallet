const webpack = require('webpack');
const config = require('../webpack.config');

// Do this as the first thing so that any code reading it knows the right env.
process.env.ASSET_PATH = '/';

delete config.chromeExtensionBoilerplate;

config.mode = process.env.NODE_ENV || 'development';

webpack(config, function (err) {
  if (err) throw err;
});
