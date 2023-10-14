const SECOND = 1000;

export const FETCH_QUERY_OPTIONS = {
  // cached for 30 sec
  apiCacheTime: 30 * SECOND
};

export const BALANCE_REFRESH_RATE = 15 * SECOND;
export const CURRENCY_REFRESH_RATE = 30 * SECOND;
export const TOKENS_REFRESH_RATE = 15 * SECOND;
export const NFT_TOKENS_REFRESH_RATE = 60 * SECOND;
export const ACCOUNT_DEPLOY_REFRESH_RATE = 30 * SECOND;
export const ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE = 30 * SECOND;
export const ERC20_TOKEN_ACTIVITY_REFRESH_RATE = 30 * SECOND;

export const LOGIN_RETRY_ATTEMPTS_LIMIT = 5;

export const TRANSFER_COST_MOTES = '100000000'; // 0.1 CSPR
export const TRANSFER_MIN_AMOUNT_MOTES = '2500000000'; // 2.5 CSPR
export const ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES = '1500000000'; // 1.5 CSPR
export const NFT_CEP47_PAYMENT_AMOUNT_AVERAGE_MOTES = '1000000000'; // 1 CSPR
export const NFT_CEP78_PAYMENT_AMOUNT_AVERAGE_MOTES = '3000000000'; // 3 CSPR

export const getBlockExplorerAccountUrl = (baseUrl: string, hash: string) =>
  `${baseUrl}/account/${hash}`;

export const getBlockExplorerContractUrl = (baseUrl: string, hash: string) =>
  `${baseUrl}/contract-package/${hash}`;

export const getBlockExplorerDeployUrl = (
  casperLiveUrl: string,
  deployHash: string
) => `${casperLiveUrl}/deploy/${deployHash}`;

export const getContractNftUrl = (
  casperLiveUrl: string,
  contractHash: string,
  tokenId: string
) => `${casperLiveUrl}/contracts/${contractHash}/nfts/${tokenId}`;

export const getBuyWithTopperUrl = (publicKey: string) =>
  `https://onramp-api.cspr.click/api/topper/bootstrap-token?account=${publicKey}&label=Your%20Public%20Key`;

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

export enum CasperNodeUrl {
  MainnetUrl = 'https://casper-node-proxy.make.services/rpc',
  TestnetUrl = 'https://casper-testnet-node-proxy.make.services/rpc'
}

export enum NetworkName {
  Mainnet = 'casper',
  Testnet = 'casper-test'
}

export enum TransferType {
  Sent = 'Sent',
  Received = 'Received',
  Unknown = 'Unknown'
}

export const ShortTypeName = {
  [TransferType.Sent]: 'Sent',
  [TransferType.Received]: 'Recv',
  [TransferType.Unknown]: 'Unk'
};

export const TypeName = {
  [TransferType.Sent]: 'Sent',
  [TransferType.Received]: 'Received',
  [TransferType.Unknown]: 'Unknown'
};

export const TypeIcons = {
  [TransferType.Sent]: 'assets/icons/transfer.svg',
  [TransferType.Received]: 'assets/icons/receive.svg',
  [TransferType.Unknown]: 'assets/icons/info.svg'
};

export const TypeColors = {
  [TransferType.Sent]: 'contentAction',
  [TransferType.Received]: 'contentPositive',
  [TransferType.Unknown]: 'contentDisabled'
};

export enum HomePageTabName {
  Tokens = 'Tokens',
  Deploys = 'Deploys',
  NFTs = 'NFTs'
}
