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
  DownloadedSecretKeys = '/downloaded-secret-keys'
}
