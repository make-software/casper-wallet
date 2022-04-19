const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const { i18nextToPot } = require('i18next-conv');

const options = {
  project: 'casper-signer-v2',
  ctxSeparator: false,
  keyseparator: false,
  foldLength: 90
};

function save(target) {
  return result => {
    writeFileSync(target, result);
  };
}

const source = path.join(__dirname, '../lang/casper-signer-v2.json');
const target = path.join(__dirname, '../lang/casper-signer-v2.pot');

i18nextToPot('en', readFileSync(source), options).then(save(target));
