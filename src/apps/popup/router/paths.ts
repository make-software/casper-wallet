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
  DownloadAccountKeys = '/download-account-keys',
  Transfer = '/transfer',
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
  AllAccountsList = '/accounts-list',
  ImportAccountFromTorus = '/import-account-from-torus',
  BuyCSPR = '/buy-cspr',
  ImportAccountFromLedger = '/import-account-from-ledger',
  SignWithLedgerInNewWindow = '/sign-with-ledger-in-new-window',
  DeployDetails = '/deploys-details',
  AddWatchAccount = '/add-watch-account'
}
