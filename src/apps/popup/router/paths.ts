export enum RouterPath {
  Any = '*',
  Home = '/',
  CreateNewAccount = '/create-new-account',
  AccountSettings = '/account-settings/:accountName',
  AccountList = '/account-list',
  Timeout = '/timeout',
  ResetVault = '/reset-vault',
  RemoveAccount = '/remove-account/:accountName',
  RenameAccount = '/rename-account/:accountName',
  NoConnectedAccount = '/no-connected-account',
  ConnectAnotherAccount = '/connect-another-account',
  ConnectAnotherAccountByParams = '/connect-another-account/:targetAccountName',
  ConnectedSites = '/connected-sites',
  BackupSecretPhrase = '/backup-secret-phrase'
}
