import { Browser } from '@src/constants';

const httpPrefixRegex = /^https?:\/\//;

export const hasHttpPrefix = (url: string) => httpPrefixRegex.test(url);

export const getUrlOrigin = (url: string) => {
  if (!url) {
    return null;
  }
  return new URL(url).origin;
};

export const isSafariBuild = process.env.BROWSER === Browser.Safari;
