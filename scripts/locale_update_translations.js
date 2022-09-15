const path = require('path');
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { gettextToI18next } = require('i18next-conv');

const options = {
  project: 'casper-wallet',
  ctxSeparator: false,
  keyseparator: false,
  foldLength: 90
};

const languages = ['en'];

languages.forEach(lang => {
  mkdirSync(path.join(__dirname, `../public/locales/${lang}`), {
    recursive: true
  });

  const sourcePath = path.join(__dirname, `../lang/${lang}.po`);
  const targetPath = path.join(
    __dirname,
    `../public/locales/${lang}/translation.json`
  );
  gettextToI18next(lang, readFileSync(sourcePath), options).then(val => {
    writeFileSync(targetPath, val);
  });
});
