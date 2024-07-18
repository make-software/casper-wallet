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
export const ERROR_DISPLAYED_BEFORE_ATTEMPT_IS_DECREMENTED = 1;

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

export const ledgerSupportLink =
  'https://support.ledger.com/hc/en-us/articles/4416379141009-Casper-CSPR?docs=true';

export enum CasperLiveUrl {
  MainnetUrl = 'https://cspr.live',
  TestnetUrl = 'https://testnet.cspr.live'
}

export enum CasperClarityApiUrl {
  MainnetUrl = 'https://event-store-api-clarity-mainnet.make.services',
  TestnetUrl = 'https://event-store-api-clarity-testnet.make.services'
}

export enum CasperWalletApiUrl {
  MainnetUrl = 'https://api.mainnet.casperwallet.io',
  TestnetUrl = 'https://api.testnet.casperwallet.io'
}

export enum NetworkSetting {
  Mainnet = 'Mainnet',
  Testnet = 'Testnet'
}

export enum Browser {
  Safari = 'safari',
  Chrome = 'chrome',
  Firefox = 'firefox',
  Edge = 'edge'
}

export enum TermsLink {
  Tos = 'https://www.casperwallet.io/tos',
  Privacy = 'https://www.casperwallet.io/privacy'
}

export enum CasperNodeUrl {
  MainnetUrl = 'https://node.cspr.cloud/rpc',
  TestnetUrl = 'https://node.testnet.cspr.cloud/rpc'
}

export const ReferrerUrl = 'https://casperwallet.io';

export enum NetworkName {
  Mainnet = 'casper',
  Testnet = 'casper-test'
}

export enum AuctionManagerContractHash {
  Mainnet = 'ccb576d6ce6dec84a551e48f0d0b7af89ddba44c7390b690036257a04a3ae9ea',
  Testnet = '93d923e336b20a4c4ca14d592b60e5bd3fe330775618290104f9beb326db7ae2'
}

export enum CSPRMarketContractHash {
  Mainnet = '31cc023b17c903a963ec60eab96a60f1fa37cb74b4b3bafc91a441e0e9d70f97',
  Testnet = '154ff59b5f9feec42d3a418058d66badcb2121dc3ffb2e3cf92596bf5aafbc88'
}

export enum AssociatedKeysContractHash {
  Mainnet = 'b2ec4f982efa8643c979cb3ab42ad1a18851c2e6f91804cd3e65c079679bdc59',
  Testnet = '676794cbbb35ff5642d0ae9c35302e244a7236a614d7e9ef58d0fb2cba6be3ed'
}

export enum ActivityType {
  Sent = 'Sent',
  Received = 'Received',
  Unknown = 'Unknown',
  Delegated = 'Delegated',
  Undelegated = 'Undelegated',
  Redelegated = 'Redelegated',
  Mint = 'Mint',
  Burn = 'Burn',
  TransferNft = 'Transfer NFT'
}

export const ActivityShortTypeName = {
  [ActivityType.Sent]: 'Sent',
  [ActivityType.Received]: 'Recv',
  [ActivityType.Unknown]: 'Unk',
  [ActivityType.Delegated]: 'Deleg',
  [ActivityType.Undelegated]: 'Undeleg',
  [ActivityType.Redelegated]: 'Redeleg',
  [ActivityType.Mint]: 'Mint NFT',
  [ActivityType.Burn]: 'Burn NFT',
  [ActivityType.TransferNft]: 'Transfer NFT'
};

export const ActivityTypeName = {
  [ActivityType.Sent]: 'Sent',
  [ActivityType.Received]: 'Received',
  [ActivityType.Unknown]: 'Unknown',
  [ActivityType.Delegated]: 'Delegated',
  [ActivityType.Undelegated]: 'Undelegated',
  [ActivityType.Redelegated]: 'Redelegated',
  [ActivityType.Mint]: 'Mint NFT',
  [ActivityType.Burn]: 'Burn NFT',
  [ActivityType.TransferNft]: 'Transfer NFT'
};

export const ActivityTypeIcons = {
  [ActivityType.Sent]: 'assets/icons/transfer.svg',
  [ActivityType.Received]: 'assets/icons/receive.svg',
  [ActivityType.Unknown]: 'assets/icons/info.svg',
  [ActivityType.Delegated]: 'assets/icons/delegate.svg',
  [ActivityType.Undelegated]: 'assets/icons/undelegate.svg',
  [ActivityType.Redelegated]: 'assets/icons/undelegate.svg',
  [ActivityType.Mint]: 'assets/icons/info.svg',
  [ActivityType.Burn]: 'assets/icons/burn.svg',
  [ActivityType.TransferNft]: 'assets/icons/transfer.svg'
};

export const ActivityTypeColors = {
  [ActivityType.Sent]: 'contentAction',
  [ActivityType.Received]: 'contentPositive',
  [ActivityType.Unknown]: 'contentDisabled',
  [ActivityType.Delegated]: 'contentAction',
  [ActivityType.Undelegated]: 'contentAction',
  [ActivityType.Redelegated]: 'contentAction',
  [ActivityType.Mint]: 'contentDisabled',
  [ActivityType.Burn]: 'contentActionCritical',
  [ActivityType.TransferNft]: 'contentAction'
};

export enum HomePageTabName {
  Tokens = 'Tokens',
  Deploys = 'Deploys',
  NFTs = 'NFTs'
}

export enum StakeSteps {
  Validator = 'validator',
  NewValidator = 'new validator',
  Amount = 'amount',
  Confirm = 'confirm',
  ConfirmWithLedger = 'confirm with ledger',
  Success = 'success'
}

export enum AuctionManagerEntryPoint {
  delegate = 'delegate',
  undelegate = 'undelegate',
  redelegate = 'redelegate'
}

export enum TokenEntryPoint {
  mint = 'mint',
  burn = 'burn',
  transfer = 'transfer'
}

// rename to AuctionManagerEntryPoint after HRD will be ready
export enum AuctionManagerEntryPoint_V2 {
  delegate = 'delegate',
  undelegate = 'undelegate',
  redelegate = 'redelegate',
  add = 'add_bid',
  withdraw = 'withdraw_bid',
  activate = 'activate_bid'
}

export const AuctionEntryPointNameMap = {
  [AuctionManagerEntryPoint_V2.add]: 'Add bid',
  [AuctionManagerEntryPoint_V2.withdraw]: 'Withdraw bid',
  [AuctionManagerEntryPoint_V2.activate]: 'Activate bid',
  [AuctionManagerEntryPoint_V2.delegate]: 'Delegate',
  [AuctionManagerEntryPoint_V2.undelegate]: 'Undelegate',
  [AuctionManagerEntryPoint_V2.redelegate]: 'Redelegate'
};

export enum NftTokenEntryPoint {
  approve = 'approve',
  burn = 'burn',
  mint = 'mint',
  transfer = 'transfer',
  update_token_meta = 'update_token_meta',
  set_approval_for_all = 'set_approval_for_all'
}

export const NftTokenEntryPointNameMap = {
  [NftTokenEntryPoint.approve]: 'Approve',
  [NftTokenEntryPoint.burn]: 'Burn',
  [NftTokenEntryPoint.mint]: 'Mint',
  [NftTokenEntryPoint.transfer]: 'Transfer',
  [NftTokenEntryPoint.update_token_meta]: 'Update',
  [NftTokenEntryPoint.set_approval_for_all]: 'Approve'
};

export enum Cep18EntryPoint {
  mint = 'mint',
  burn = 'burn',
  transfer = 'transfer',
  increase_allowance = 'increase_allowance'
}

export const Cep18EntryPointNameMap = {
  [Cep18EntryPoint.mint]: 'Mint',
  [Cep18EntryPoint.burn]: 'Burn',
  [Cep18EntryPoint.transfer]: 'Transfer',
  [Cep18EntryPoint.increase_allowance]: 'Increase allowance'
};

export enum CsprMarketEntryPoint {
  delist_token = 'delist_token',
  list_token = 'list_token',
  accept_offer = 'accept_offer',
  cancel_offer = 'cancel_offer',
  make_offer = 'make_offer'
}

export const CsprMarketEntryPointNameMap = {
  [CsprMarketEntryPoint.delist_token]: 'Delist',
  [CsprMarketEntryPoint.list_token]: 'List',
  [CsprMarketEntryPoint.accept_offer]: 'Accept offer',
  [CsprMarketEntryPoint.cancel_offer]: 'Cancel offer',
  [CsprMarketEntryPoint.make_offer]: 'Make offer'
};

export const ExecutionTypesMap = {
  1: 'WASM deploy', //"ModuleBytes"
  2: 'Contract call', //"StoredContractByHash"
  3: 'Contract call', //"StoredContractByName",
  4: 'Contract call', //"StoredVersionedContractByHash",
  5: 'Contract call', //"StoredVersionedContractByName",
  6: 'Transfer'
};

export const TRANSFER = 6;

export enum ContractTypeId {
  System = 1,
  Cep18 = 2,
  CustomCep18 = 3,
  CEP47Nft = 4,
  CustomCEP47Nft = 5,
  DeFi = 6,
  CEP78Nft = 7,
  CustomCEP78Nft = 8,
  CSPRMarket = 9
}

export enum DeployIcon {
  Generic = 'assets/icons/generic.svg',
  Auction = '/assets/icons/auction.svg',
  NativeTransfer = '/assets/icons/casper.svg',
  CSPRStudio = '/assets/icons/cspr-studio.svg',
  CSPRMarket = '/assets/icons/cspr-market.svg',
  AssociatedKeys = '/assets/icons/associated-keys.svg'
}
