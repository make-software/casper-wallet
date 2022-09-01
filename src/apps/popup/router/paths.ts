export enum RouterPath {
  Any = '*',
  Home = '/',
  AccountSettings = '/account-settings/:accountName',
  Timeout = '/timeout',
  ResetVault = '/reset-vault',
  RemoveAccount = '/remove-account/:accountName',
  RenameAccount = '/rename-account/:accountName',
  NoConnectedAccount = '/no-connected-account',
  ConnectAnotherAccount = '/connect-another-account',
  ConnectedSites = '/connected-sites'
}
