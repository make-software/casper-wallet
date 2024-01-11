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
export const VALIDATORS_REFRESH_RATE = 30 * SECOND;

export const LOGIN_RETRY_ATTEMPTS_LIMIT = 5;

export const MOTES_PER_CSPR_RATE = '1000000000'; // 1 000 000 000 MOTES === 1 CSPR
export const TRANSFER_COST_MOTES = '100000000'; // 0.1 CSPR
export const TRANSFER_MIN_AMOUNT_MOTES = '2500000000'; // 2.5 CSPR
export const ERC20_PAYMENT_AMOUNT_AVERAGE_MOTES = '1500000000'; // 1.5 CSPR
export const NFT_CEP47_PAYMENT_AMOUNT_AVERAGE_MOTES = '1000000000'; // 1 CSPR
export const NFT_CEP78_PAYMENT_AMOUNT_AVERAGE_MOTES = '3000000000'; // 3 CSPR
export const STAKE_COST_MOTES = '2500000000'; // 2.5 CSPR
export const DELEGATION_MIN_AMOUNT_MOTES = '500000000000'; // 500 CSPR
export const MAX_DELEGATORS = 1200;

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

export enum AuctionManagerContractHash {
  Mainnet = 'ccb576d6ce6dec84a551e48f0d0b7af89ddba44c7390b690036257a04a3ae9ea',
  Testnet = '93d923e336b20a4c4ca14d592b60e5bd3fe330775618290104f9beb326db7ae2'
}

export enum ActivityType {
  Sent = 'Sent',
  Received = 'Received',
  Unknown = 'Unknown',
  Delegated = 'Delegated',
  Undelegated = 'Undelegated',
  Redelegated = 'Redelegated',
  Mint = 'Mint',
  Burn = 'Burn'
}

export const ActivityShortTypeName = {
  [ActivityType.Sent]: 'Sent',
  [ActivityType.Received]: 'Recv',
  [ActivityType.Unknown]: 'Unk',
  [ActivityType.Delegated]: 'Deleg',
  [ActivityType.Undelegated]: 'Undeleg',
  [ActivityType.Redelegated]: 'Redeleg',
  [ActivityType.Mint]: 'Mint',
  [ActivityType.Burn]: 'Burn'
};

export const ActivityTypeName = {
  [ActivityType.Sent]: 'Sent',
  [ActivityType.Received]: 'Received',
  [ActivityType.Unknown]: 'Unknown',
  [ActivityType.Delegated]: 'Delegated',
  [ActivityType.Undelegated]: 'Undelegated',
  [ActivityType.Redelegated]: 'Redelegated',
  [ActivityType.Mint]: 'Mint',
  [ActivityType.Burn]: 'Burn'
};

export const ActivityTypeIcons = {
  [ActivityType.Sent]: 'assets/icons/transfer.svg',
  [ActivityType.Received]: 'assets/icons/receive.svg',
  [ActivityType.Unknown]: 'assets/icons/info.svg',
  [ActivityType.Delegated]: 'assets/icons/delegate.svg',
  [ActivityType.Undelegated]: 'assets/icons/undelegate.svg',
  [ActivityType.Redelegated]: 'assets/icons/undelegate.svg',
  [ActivityType.Mint]: 'assets/icons/info.svg',
  [ActivityType.Burn]: 'assets/icons/burn.svg'
};

export const ActivityTypeColors = {
  [ActivityType.Sent]: 'contentAction',
  [ActivityType.Received]: 'contentPositive',
  [ActivityType.Unknown]: 'contentDisabled',
  [ActivityType.Delegated]: 'contentAction',
  [ActivityType.Undelegated]: 'contentAction',
  [ActivityType.Redelegated]: 'contentAction',
  [ActivityType.Mint]: 'contentDisabled',
  [ActivityType.Burn]: 'contentAction'
};

export enum HomePageTabName {
  Tokens = 'Tokens',
  Deploys = 'Deploys',
  NFTs = 'NFTs'
}

export enum StakeSteps {
  Validator = 'validator',
  Amount = 'amount',
  Confirm = 'confirm',
  Success = 'success'
}

export enum AuctionManagerEntryPoint {
  delegate = 'delegate',
  undelegate = 'undelegate',
  redelegate = 'redelegate'
}

export enum TokenEntryPoint {
  mint = 'mint',
  burn = 'burn'
}
