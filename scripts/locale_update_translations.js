const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const { gettextToI18next } = require('i18next-conv');

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

const languages = ['en', 'tr', 'ua', 'fr', 'nl', 'ru', 'pl', 'vi', 'az', 'es'];

languages.forEach(lang => {
  const source = path.join(__dirname, `../lang/${lang}.po`);
  const target = path.join(
    __dirname,
    `../src/assets/locales/${lang}/translation.json`
  );

  gettextToI18next(lang, readFileSync(source), options).then(save(target));
});
