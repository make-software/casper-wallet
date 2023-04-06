const SECOND = 1000;

export const getBlockExplorerAccountUrl = (baseUrl: string, hash: string) =>
  `${baseUrl}/account/${hash}`;

export const FETCH_QUERY_OPTIONS = {
  // cached for 30 sec
  apiCacheTime: 30 * SECOND
};

export const LOGIN_RETRY_ATTEMPTS_LIMIT = 5;

export enum CasperLiveUrl {
  MainnetUrl = 'https://cspr.live',
  TestnetUrl = 'https://testnet.cspr.live'
}

export enum CasperApiUrl {
  MainnetUrl = 'https://event-store-api-clarity-mainnet.make.services',
  TestnetUrl = 'https://event-store-api-clarity-testnet.make.services'
}

export enum NetworkSetting {
  Mainnet = 'Mainnet',
  Testnet = 'Testnet'
}

export enum Browser {
  Safari = 'safari',
  Chrome = 'chrome',
  Firefox = 'firefox'
}
