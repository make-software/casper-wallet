import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import detector from './language-detector';

const languageDetector = new LanguageDetector();
languageDetector.addDetector(detector);

// eslint-disable-next-line import/no-named-as-default-member
i18n
  .use(Backend)
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    detection: {
      order: ['customLanguageDetector'],
      lookupLocalStorage: 'i18nextLng'
    },
    debug: false,
    fallbackLng: 'en',
    returnEmptyString: false,
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    contextSeparator: false as any,
    keySeparator: false as any,
    nsSeparator: false as any
  });
