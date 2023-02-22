const BASE_URL_TESTNET =
  'https://event-store-api-clarity-testnet.make.services';

const SECOND = 1000;

export function getCasperApiUrl() {
  return BASE_URL_TESTNET;
}

export const FETCH_QUERY_OPTIONS = {
  // cached for 30 sec
  apiCacheTime: 30 * SECOND
};

export const LOGIN_RETRY_ATTEMPTS_LIMIT = 5;
