const httpPrefixRegex = /^https?:\/\//;

export const hasHttpPrefix = (url: string) => httpPrefixRegex.test(url);

export const getUrlOrigin = (url: string) => {
  if (!url) {
    return null;
  }
  return new URL(url).origin;
};
