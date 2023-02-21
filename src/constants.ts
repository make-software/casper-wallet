const BASE_URL_TESTNET =
  'https://event-store-api-clarity-testnet.make.services';

const CSPR_LIVE_URL = 'https://cspr.live';

const SECOND = 1000;

export function getCasperApiUrl() {
  return BASE_URL_TESTNET;
}

export const getCSPRLiveUserAccountUrl = (hash: string) =>
  `${CSPR_LIVE_URL}/account/${hash}`;

export const FETCH_QUERY_OPTIONS = {
  // cached for 30 sec
  apiCacheTime: 30 * SECOND
};
