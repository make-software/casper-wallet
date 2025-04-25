import { Page } from '@playwright/test';
import path from 'path';

export const newPassword = 'this is new password';
export const vaultPassword = '3hQqzYn4C7Y8rEZTVEZb';
export const twentyFourWordsSecretPhrase =
  'hold matrix spider subway bottom jazz charge fire lawn valley stay coil moral hospital dream cycle multiply december agree huge major tower devote old';
export const twelveWordsSecretPhrase =
  'small vendor member cry motion lava hurdle gravity cry sentence medal seminar';
export const secretKeyPathForPEM = path.join(
  __dirname,
  './account_secret_key.pem'
);
export const secretKeyPathForCER = path.join(
  __dirname,
  './account_secret_key.cer'
);

export const torusSecretKeyHex =
  '1ac774d1b4e05a5546ddc8345e8ccf1d7ef3d19b0e5cd722f161260e6bf1d35d';

export const ACCOUNT_NAMES = {
  defaultFirstAccountName: 'Account 1',
  defaultSecondAccountName: 'Account 2',
  createdAccountName: 'First New Account',
  createdAccountName2: 'Second New account ',
  importedPemAccountName: 'Imported pem account',
  renamedAccountName: 'Renamed account',
  importedCerAccountName: 'Imported cer account',
  importedTorusAccountName: 'Torus account'
};

export const PLAYGROUND_URL =
  'https://cspr-wallet-playground.dev.make.services/';

export const IMPORTED_PEM_ACCOUNT = {
  accountName: ACCOUNT_NAMES.importedPemAccountName,
  publicKey:
    '0184f6d260f4ee6869ddb36affe15456de6ae045278fa2f467bb677561ce0dad55',
  truncatedPublicKey: '0184f...dad55',
  mediumTruncatedPublicKey: '0184f6d260...561ce0dad55'
};

export const IMPORTED_CER_ACCOUNT = {
  accountName: ACCOUNT_NAMES.importedCerAccountName,
  publicKey:
    '01a8d1042fa244f39fe4caa1660fc6dce522b3afe649dbe61f7d16e240168e6ff2',
  truncatedPublicKey: '01a8d...e6ff2',
  mediumTruncatedPublicKey: '01a8d1042f...40168e6ff2'
};

export const IMPORTED_TORUS_ACCOUNT = {
  accountName: ACCOUNT_NAMES.importedTorusAccountName,
  publicKey:
    '02029fcc5bb34a6b2768086ac3bad7ccab6870e980df2c53f26ec06a8865182ffd4f',
  truncatedPublicKey: '02029...ffd4f',
  mediumTruncatedPublicKey: '02029fcc5b...65182ffd4f'
};
export function accountSettingLocator(accountName: string) {
  return `xpath=//div[contains(@class, 'sc-hLBbgP') and contains(@class, 'fYMUrO')]//span[text()='${accountName}']/ancestor::div[contains(@class, 'sc-hLBbgP')]/following-sibling::div[@data-testid='popover-children-container']`;
}
export const DEFAULT_FIRST_ACCOUNT = {
  accountName: ACCOUNT_NAMES.defaultFirstAccountName,
  publicKey:
    '0202b1943511b8c23b1b2b8ed7ddcedffcc7be70d9366a5005c7beab08a81b7ae633',
  truncatedPublicKey: '0202b...ae633',
  mediumTruncatedPublicKey: '0202b19435...a81b7ae633'
};
export const FIRST_CONTACT = {
  accountName: 'First contact',
  publicKey:
    '0202b1943511b8c23b1b2b8ed7ddcedffcc7be70d9366a5005c7beab08a81b7ae631',
  truncatedPublicKey: '0202b...ae631',
  mediumTruncatedPublicKey: '0202b19435...a81b7ae631'
};
export const SECOND_CONTACT = {
  accountName: 'Second contact',
  publicKey:
    '0202b1943511b8c23b1b2b8ed7ddcedffcc7be70d9366a5005c7beab08a81b7ae666',
  truncatedPublicKey: '0202b...ae666',
  mediumTruncatedPublicKey: '0202b19435...a81b7ae666'
};

export const DEFAULT_SECOND_ACCOUNT = {
  accountName: ACCOUNT_NAMES.defaultSecondAccountName,
  publicKey:
    '0203b2e05f074452f5e69ba512310deceaca152ebd3394eadcec26c6e68e91aa7724',
  truncatedPublicKey: '0203b...a7724',
  mediumTruncatedPublicKey: '0203b2e05f...8e91aa7724'
};

export const RECOVER_FIRST_ACCOUNT_FROM_TWELVE_WORDS = {
  accountName: 'Account 1',
  publicKey:
    '0202b869dbed03ef2cc6a76e54e1a5c588fbe6198f80937994f9a2c1fd3aff4adc1b',
  truncatedPublicKey: '0202b...adc1b'
};

export const RECOVER_SECOND_ACCOUNT_FROM_TWELVE_WORDS = {
  accountName: 'Account 2',
  publicKey:
    '02022cafccfb61ffc4e4221e4d2c38eec6035d579d04c1396b1c2027dc0729c53589',
  truncatedPublicKey: '02022...53589'
};

export const VALIDATOR_FOR_SIGNATURE_REQUEST = {
  name: 'Validator',
  truncatedPublicKey: '0106c...ca2ca'
};

export const NEW_VALIDATOR_FOR_SIGNATURE_REQUEST = {
  name: 'New validator',
  truncatedPublicKey: '017d9...2009e'
};

export const VALIDATOR_FOR_STAKE = {
  publicKey:
    '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca',
  truncatedPublicKey: '0106...a2ca'
};

export const VALIDATOR_FOR_UNDELEGATE = {
  publicKey:
    '01f340df2c32f25391e8f7924a99e93cab3a6f230ff7af1cacbfc070772cbebd94',
  truncatedPublicKey: '01f3...bd94'
};

export const NEW_VALIDATOR_FOR_STAKE = {
  publicKey:
    '01c8be540a643e6c9df283dd2d2d6be67748f69a3c7bb6cf34471c899b8e858c9a',
  truncatedPublicKey: '01c8...8c9a'
};

export const URLS = {
  rpc: 'https://node.testnet.cspr.cloud/rpc'
};

export const RPC_RESPONSE = {
  success: {
    status: 200,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1717761373590,
      result: {
        api_version: '2.0.0',
        transaction_hash: {
          Version1:
            '9de32b7f6d79e559cb3f7b94250a605739de803d98ec681cc4a4b7dc8604fdae'
        }
      }
    })
  },
  failure: {
    status: 500,
    body: JSON.stringify({
      sourceErr: {
        code: -32016,
        data: 'error description',
        message: 'error message'
      },
      id: 1,
      jsonrpc: '2.0'
    })
  }
};
