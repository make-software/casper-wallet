import { EnabledLanguages, LangCode } from './constants';

const localStorageAvailable = (): boolean =>
  // @ts-ignore
  window !== 'undefined' && window.localStorage !== null;

const navigatorAvailable = (): boolean =>
  // @ts-ignore
  window !== 'undefined' && window.navigator !== null;

const languageDetector = {
  name: 'customLanguageDetector',
  lookup(options: { lookupLocalStorage: string }) {
    let result: string = LangCode.EN; // default language. Used as fallback.

    // check if language previously stored in localStorage
    if (options.lookupLocalStorage && localStorageAvailable()) {
      const lng = window.localStorage.getItem(options.lookupLocalStorage);
      if (lng) {
        return lng;
      }
    }

    // if not found in localStorage, then check userAgent and try to found in
    // the list of available languages
    if (navigatorAvailable() && window.navigator.language !== undefined) {
      if (EnabledLanguages.includes(window.navigator.language)) {
        result = window.navigator.language;
      }
    }

    return result;
  },
  cacheUserLanguage(lng: string, options: { lookupLocalStorage: string }) {
    if (options.lookupLocalStorage && localStorageAvailable()) {
      window.localStorage.setItem(options.lookupLocalStorage, lng);
    }
  }
};

export default languageDetector;
