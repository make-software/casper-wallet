import path from 'path';

export const vaultPassword = '3hQqzYn4C7Y8rEZTVEZb';
export const recoverSecretPhrase =
  'hold matrix spider subway bottom jazz charge fire lawn valley stay coil moral hospital dream cycle multiply december agree huge major tower devote old';
export const secretKeyPath = path.join(__dirname, '../account_secret_key.pem');

export const ACCOUNT_NAMES = {
  defaultFirstAccountName: 'Account 1',
  defaultSecondAccountName: 'Account 2',
  createdAccountName: 'New account 1',
  importedAccountName: 'Imported account',
  renamedAccountName: 'Renamed account'
};

export const PLAYGROUND_URL = 'https://casper-wallet-playground.make.services/';

export const IMPORTED_ACCOUNT = {
  accountName: ACCOUNT_NAMES.importedAccountName,
  publicKey:
    '0184f6d260f4ee6869ddb36affe15456de6ae045278fa2f467bb677561ce0dad55',
  truncatedPublicKey: '0184f...dad55'
};

export const DEFAULT_FIRST_ACCOUNT = {
  accountName: ACCOUNT_NAMES.defaultFirstAccountName,
  publicKey:
    '0202b1943511b8c23b1b2b8ed7ddcedffcc7be70d9366a5005c7beab08a81b7ae633',
  truncatedPublicKey: '0202b...ae633'
};

export const DEFAULT_SECOND_ACCOUNT = {
  accountName: ACCOUNT_NAMES.defaultSecondAccountName,
  publicKey:
    '0203b2e05f074452f5e69ba512310deceaca152ebd3394eadcec26c6e68e91aa7724',
  truncatedPublicKey: '0203b...a7724'
};
