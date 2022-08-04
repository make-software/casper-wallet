export enum RouterPath {
  Home = '/',
  CreateVault = '/create-vault',
  AccountSettings = '/account-settings/:accountName',
  RemoveAccount = '/remove-account/:accountName',
  RenameAccount = '/rename-account/:accountName',
  NoAccounts = '/no-accounts',
  NoConnectedAccount = '/no-connected-account',
  UnlockVault = '/unlock-vault',
  Timeout = '/timeout',
  ResetVault = '/reset-vault',
  ConnectAnotherAccount = '/connect-another-account'
}
