import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import detector from './language-detector';

const languageDetector = new LanguageDetector();
languageDetector.addDetector(detector);

i18n
  // loads translations from your server
  .use(Backend)
  // detect user language
  .use(languageDetector)
  // adds react support
  .use(initReactI18next)
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    detection: {
      order: ['customLanguageDetector'],
      lookupLocalStorage: 'i18nextLng-v1'
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

export default i18n;
