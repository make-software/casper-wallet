export const ACCOUNT_NAMES = {
  defaultAccountName: 'Account 1',
  createdAccountName: 'New account 1',
  importedAccountName: 'Imported account'
};

export const PLAYGROUND_URL = 'https://casper-wallet-playground.make.services/';

export const IMPORTED_ACCOUNT = {
  accountName: ACCOUNT_NAMES.importedAccountName,
  publicKey:
    '0184f6d260f4ee6869ddb36affe15456de6ae045278fa2f467bb677561ce0dad55',
  truncatedPublicKey: '0184f...dad55'
};

export const DEFAULT_ACCOUNT = {
  accountName: ACCOUNT_NAMES.defaultAccountName,
  publicKey:
    '02021006f7e7ecba9dda1fbd68bd88b0b509ce07a24c4ce8a96c62d44bec4beb9f9d',
  truncatedPublicKey: '02021...b9f9d'
};

export const TIMEOUT = {
  '15sec': 1000 * 15,
  '50sec': 1000 * 50
};
