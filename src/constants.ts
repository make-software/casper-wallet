const SECOND = 1000;

export const getBlockExplorerAccountUrl = (baseUrl: string, hash: string) =>
  `${baseUrl}/account/${hash}`;

export const getBlockExplorerDeployUrl = (
  casperLiveUrl: string,
  deployHash: string
) => `${casperLiveUrl}/deploy/${deployHash}`;

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

export enum TermsLink {
  Tos = 'https://www.casperwallet.io/tos',
  Privacy = 'https://www.casperwallet.io/privacy'
}

export enum GrpcUrl {
  TestNetUrl = 'https://node-clarity-testnet.make.services/rpc',
  MainnetUrl = 'https://node-clarity-mainnet.make.services/rpc'
}

export enum NetworkName {
  Mainnet = 'casper',
  Testnet = 'casper-test'
}

export const TRANSFER_COST_MOTES = '100000000';

export const TRANSFER_MIN_AMOUNT_MOTES = '2500000000';
