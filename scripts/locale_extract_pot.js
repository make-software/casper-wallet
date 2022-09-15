const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const { i18nextToPot } = require('i18next-conv');

const options = {
  project: 'casper-wallet',
  ctxSeparator: false,
  keyseparator: false,
  foldLength: 90
};

const sourcePath = path.join(__dirname, '../lang/casper-wallet.json');
const targetPath = path.join(__dirname, '../lang/casper-wallet.pot');

// create template for translation portal
i18nextToPot('en', readFileSync(sourcePath), options).then(val => {
  writeFileSync(targetPath, val);
});

// temporary creation of initial translation po file
// when translation portal is integrated it will create po files
i18nextToPot('en', readFileSync(sourcePath), options).then(val => {
  writeFileSync(path.join(__dirname, '../lang/en.po'), val);
});
