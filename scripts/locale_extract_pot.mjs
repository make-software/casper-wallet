import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { i18nextToPot } from 'i18next-conv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
