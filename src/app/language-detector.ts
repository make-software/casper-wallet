import { ActiveLanguages, Lang } from './domain';

const localStorageAvailable = (): boolean =>
  // @ts-ignore
  window !== 'undefined' && window.localStorage !== null;

const navigatorAvailable = (): boolean =>
  // @ts-ignore
  window !== 'undefined' && window.navigator !== null;

type Language = Lang | string;

const LanguageDetector = {
  name: 'customLanguageDetector',
  lookup(options: { lookupLocalStorage: string }) {
    let result: Language = Lang.EN; // default language. Used as fallback.

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
      if (ActiveLanguages.includes(window.navigator.language as Lang)) {
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

export default LanguageDetector;
