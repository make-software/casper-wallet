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

export const PENDING_DEPLOY_REFETCH_INTERVAL = 5 * 1000;

export const getBlockExplorerAccountUrl = (
  casperLiveUrl: string,
  publicKey: string
) => {
  const path = publicKey?.includes('uref') ? 'uref' : 'account';

  return `${casperLiveUrl}/${path}/${publicKey}`;
};

export const getBlockExplorerContractPackageUrl = (
  casperLiveUrl: string,
  contractPackageHash: string
) => `${casperLiveUrl}/contract-package/${contractPackageHash}`;

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

export enum CSPRStudioCep47ContractHash {
  Mainnet = 'c4e5a03066ce3c6006f562939e48f7076c77de5d46cf8fe625c41e02c5e74814',
  Testnet = '998af6825d77da15485baf4bb89aeef3f1dfb4a78841d149574b0be694ce4821'
}

export enum AuctionPoolContractHash {
  Mainnet = '6174cf2e6f8fed1715c9a3bace9c50bfe572eecb763b0ed3f644532616452008',
  Testnet = '6174cf2e6f8fed1715c9a3bace9c50bfe572eecb763b0ed3f644532616452008'
}

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

export const ExecutionTypesMap: { [key in number]: string } = {
  1: 'WASM deploy', //"ModuleBytes"
  2: 'Contract call', //"StoredContractByHash"
  3: 'Contract call', //"StoredContractByName",
  4: 'Contract call', //"StoredVersionedContractByHash",
  5: 'Contract call', //"StoredVersionedContractByName",
  6: 'Transfer'
};

export enum DeployIcon {
  Generic = 'assets/icons/generic.svg',
  Auction = '/assets/icons/auction.svg',
  NativeTransfer = '/assets/icons/casper.svg',
  CSPRStudio = '/assets/icons/cspr-studio.svg',
  CSPRMarket = '/assets/icons/cspr-market.svg',
  AssociatedKeys = '/assets/icons/associated-keys.svg',
  Cep18Default = '/assets/icons/cep-18-default.svg',
  NFTDefault = 'assets/icons/nft-contract-icon.svg'
}

export enum AuctionDeployEntryPoint {
  delegate = 'delegate',
  undelegate = 'undelegate',
  redelegate = 'redelegate',
  add = 'add_bid',
  withdraw = 'withdraw_bid',
  activate = 'activate_bid'
}

export const AuctionDeployEntryPointNameMap = {
  [AuctionDeployEntryPoint.add]: 'Add bid',
  [AuctionDeployEntryPoint.withdraw]: 'Withdraw bid',
  [AuctionDeployEntryPoint.activate]: 'Activate bid',
  [AuctionDeployEntryPoint.delegate]: 'Delegate',
  [AuctionDeployEntryPoint.undelegate]: 'Undelegate',
  [AuctionDeployEntryPoint.redelegate]: 'Redelegate'
};

export const AuctionDeployActionName = {
  [AuctionDeployEntryPoint.add]: 'Add bid',
  [AuctionDeployEntryPoint.withdraw]: 'Withdraw bid',
  [AuctionDeployEntryPoint.activate]: 'Activate bid',
  [AuctionDeployEntryPoint.delegate]: 'Delegate',
  [AuctionDeployEntryPoint.undelegate]: 'Undelegate',
  [AuctionDeployEntryPoint.redelegate]: 'Redelegate'
};

export enum NftDeployEntryPoint {
  approve = 'approve',
  burn = 'burn',
  mint = 'mint',
  transfer = 'transfer',
  update_token_meta = 'update_token_meta',
  set_approval_for_all = 'set_approval_for_all'
}

export const NftDeployEntryPointNameMap = {
  [NftDeployEntryPoint.approve]: 'Approve transfer',
  [NftDeployEntryPoint.burn]: 'Burn',
  [NftDeployEntryPoint.mint]: 'Mint',
  [NftDeployEntryPoint.transfer]: 'Transfer',
  [NftDeployEntryPoint.update_token_meta]: 'Update metadata',
  [NftDeployEntryPoint.set_approval_for_all]: 'Approve transfer'
};

export const NftDeployActionName = {
  [NftDeployEntryPoint.approve]: 'Approve transfer rights',
  [NftDeployEntryPoint.burn]: 'Burn',
  [NftDeployEntryPoint.mint]: 'Mint',
  [NftDeployEntryPoint.transfer]: 'Transfer',
  [NftDeployEntryPoint.update_token_meta]: 'Update metadata',
  [NftDeployEntryPoint.set_approval_for_all]: 'Approve transfer rights'
};

export const NftDeployResultName = {
  [NftDeployEntryPoint.approve]: 'Granted transfer rights',
  [NftDeployEntryPoint.burn]: 'Burned',
  [NftDeployEntryPoint.mint]: 'Minted',
  [NftDeployEntryPoint.transfer]: 'Transferred',
  [NftDeployEntryPoint.update_token_meta]: 'Updated metadata',
  [NftDeployEntryPoint.set_approval_for_all]: 'Granted transfer rights'
};

export enum Cep18DeployEntryPoint {
  approve = 'approve',
  mint = 'mint',
  burn = 'burn',
  transfer = 'transfer'
}

export const Cep18DeployEntryPointNameMap = {
  [Cep18DeployEntryPoint.approve]: 'Approve',
  [Cep18DeployEntryPoint.burn]: 'Burn',
  [Cep18DeployEntryPoint.mint]: 'Mint',
  [Cep18DeployEntryPoint.transfer]: 'Transfer'
};

export const Cep18DeployActionName = {
  [Cep18DeployEntryPoint.approve]: 'Approve transfer rights',
  [Cep18DeployEntryPoint.burn]: 'Burn',
  [Cep18DeployEntryPoint.mint]: 'Mint',
  [Cep18DeployEntryPoint.transfer]: 'Transfer'
};

export const Cep18DeployResultName = {
  [Cep18DeployEntryPoint.approve]: 'Granted transfer rights',
  [Cep18DeployEntryPoint.burn]: 'Burned',
  [Cep18DeployEntryPoint.mint]: 'Minted',
  [Cep18DeployEntryPoint.transfer]: 'Transferred'
};

export enum CsprMarketDeployEntryPoint {
  delist_token = 'delist_token',
  list_token = 'list_token',
  accept_offer = 'accept_offer',
  cancel_offer = 'cancel_offer',
  make_offer = 'make_offer'
}

export const CsprMarketDeployEntryPointNameMap = {
  [CsprMarketDeployEntryPoint.accept_offer]: 'Accept offer',
  [CsprMarketDeployEntryPoint.cancel_offer]: 'Cancel offer',
  [CsprMarketDeployEntryPoint.delist_token]: 'Delist',
  [CsprMarketDeployEntryPoint.list_token]: 'List',
  [CsprMarketDeployEntryPoint.make_offer]: 'Make offer'
};

export const DeployPlateEntryPointNameMap: { [key: string]: string } = {
  ...AuctionDeployEntryPointNameMap,
  ...CsprMarketDeployEntryPointNameMap,
  ...Cep18DeployEntryPointNameMap,
  ...NftDeployEntryPointNameMap
};

export const DeployActionEntryPointNameMap: { [key: string]: string } = {
  ...Cep18DeployActionName,
  ...NftDeployActionName,
  ...AuctionDeployActionName,
  ...CsprMarketDeployEntryPointNameMap
};

export const DeployResultEntryPointNameMap: { [key: string]: string } = {
  ...Cep18DeployResultName,
  ...NftDeployResultName,
  ...CsprMarketDeployEntryPointNameMap
};
