export enum RouterPath {
  Any = '*',
  Home = '/',
  CreateAccount = '/create-account',
  AccountSettings = '/account-settings/:accountName',
  AccountList = '/account-list',
  Timeout = '/timeout',
  RemoveAccount = '/remove-account/:accountName',
  RenameAccount = '/rename-account/:accountName',
  NoConnectedAccount = '/no-connected-account',
  ConnectAnotherAccount = '/connect-another-account',
  ConnectAnotherAccountByParams = '/connect-another-account/:targetAccountName',
  ConnectedSites = '/connected-sites',
  BackupSecretPhrase = '/backup-secret-phrase',
  DownloadSecretKeys = '/download-secret-keys',
  DownloadedSecretKeys = '/downloaded-secret-keys',
  Transfer = '/transfer/:tokenContractPackageHash/:tokenContractHash',
  TransferNoParams = '/transfer',
  ActivityDetails = '/activity-details',
  Token = '/token/:tokenName',
  Receive = '/receive',
  NftDetails = '/nft-details/:contractPackageHash/nfts/:tokenId',
  GenerateWalletQRCode = '/generate-wallet-qr-code',
  TransferNft = '/transfer-nft/:contractPackageHash/nfts/:tokenId',
  ChangePassword = '/change-password',
  Delegate = '/delegate',
  Undelegate = '/undelegate',
  Redelegate = '/redelegate',
  ContactList = '/contact-list',
  AddContact = '/add-contact',
  ContactDetails = '/contact-list/:contactName',
  RateApp = '/rate-app',
  AllAccountsList = '/accounts-list'
}
