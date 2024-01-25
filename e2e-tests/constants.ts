import path from 'path';

export const vaultPassword = '3hQqzYn4C7Y8rEZTVEZb';
export const twentyFourWordsSecretPhrase =
  'hold matrix spider subway bottom jazz charge fire lawn valley stay coil moral hospital dream cycle multiply december agree huge major tower devote old';
export const twelveWordsSecretPhrase =
  'small vendor member cry motion lava hurdle gravity cry sentence medal seminar';
export const secretKeyPath = path.join(__dirname, './account_secret_key.pem');

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
  truncatedPublicKey: '0184f...dad55',
  mediumTruncatedPublicKey: '0184f6d260...561ce0dad55'
};

export const DEFAULT_FIRST_ACCOUNT = {
  accountName: ACCOUNT_NAMES.defaultFirstAccountName,
  publicKey:
    '0202b1943511b8c23b1b2b8ed7ddcedffcc7be70d9366a5005c7beab08a81b7ae633',
  truncatedPublicKey: '0202b...ae633',
  mediumTruncatedPublicKey: '0202b19435...a81b7ae633'
};

export const DEFAULT_SECOND_ACCOUNT = {
  accountName: ACCOUNT_NAMES.defaultSecondAccountName,
  publicKey:
    '0203b2e05f074452f5e69ba512310deceaca152ebd3394eadcec26c6e68e91aa7724',
  truncatedPublicKey: '0203b...a7724',
  mediumTruncatedPublicKey: '0203b2e05f...8e91aa7724'
};

export const RECOVER_ACCOUNT_FROM_TWELVE_WORDS = {
  accountName: 'Account 1',
  publicKey:
    '0202b869dbed03ef2cc6a76e54e1a5c588fbe6198f80937994f9a2c1fd3aff4adc1b',
  truncatedPublicKey: '0202b...adc1b'
};

export const VALIDATOR = {
  name: 'Validator',
  truncatedPublicKey: '0106c...ca2ca'
};

export const NEW_VALIDATOR = {
  name: 'New validator',
  truncatedPublicKey: '017d9...2009e'
};
