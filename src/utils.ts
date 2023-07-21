import Big from 'big.js';
import { CLPublicKey } from 'casper-js-sdk';

import { Browser } from '@src/constants';

const httpPrefixRegex = /^https?:\/\//;

export const hasHttpPrefix = (url: string) => httpPrefixRegex.test(url);

export const getUrlOrigin = (url: string | undefined) => {
  if (!url) {
    return undefined;
  }
  return new URL(url).origin;
};

export const isSafariBuild = process.env.BROWSER === Browser.Safari;

export const isValidU64 = (value?: string): boolean => {
  if (!value) {
    return false;
  }

  try {
    return Big(value).gte('0') && Big(value).lte('18446744073709551615');
  } catch (error) {
    return false;
  }
};

export const isValidPublicKey = (
  publicKey?: string | null
): publicKey is string => {
  if (publicKey == null) {
    return false;
  }

  const ED25519_KEY_ALGO_PREFIX = '01';
  const SECP256K1_KEY_ALGO_PREFIX = '02';
  const publicKeyRegExp = new RegExp(/^[a-fA-F0-9]*$/);

  if (!publicKeyRegExp.test(publicKey)) {
    return false;
  }

  const prefix = publicKey.slice(0, 2);
  if (
    (prefix === ED25519_KEY_ALGO_PREFIX && publicKey.length !== 66) ||
    (prefix === SECP256K1_KEY_ALGO_PREFIX && publicKey.length !== 68)
  ) {
    return false;
  }

  try {
    CLPublicKey.fromHex(publicKey).toHex(false);
    return true;
  } catch (error) {
    return false;
  }
};

export const notEmpty = <TValue>(
  value: TValue | null | undefined
): value is TValue => {
  return !(value === null || value === undefined);
};

export enum NamedKeyPrefix {
  HASH = 'hash-',
  CONTRACT = 'contract-',
  UREF = 'uref-',
  DEPLOY = 'deploy-',
  ERA_INFO_PREFIX = 'era-',
  BALANCE_PREFIX = 'balance-',
  BID_PREFIX = 'bid-',
  WITHDRAW_PREFIX = 'withdraw-',
  DICTIONARY_PREFIX = 'dictionary-',
  ACCOUNT_HASH = 'account-hash-',
  CONTRACT_PACKAGE = 'contract-package-'
}

export const hashPrefixRegEx = new RegExp(
  `(${Object.values(NamedKeyPrefix).join('|')})(?=[0-9a-fA-F])`,
  'i'
);

export interface SplitDataType {
  prefix: string;
  hash: string;
}

export const deriveSplitDataFromNamedKeyValue = (
  namedKeyValue: string
): SplitDataType => {
  const [hash, lastDigits] = namedKeyValue
    .replace(hashPrefixRegEx, '')
    .split('-');

  const formattedPrefix = namedKeyValue.match(hashPrefixRegEx)
    ? namedKeyValue.match(hashPrefixRegEx)![0]
    : '';
  const formattedHash = lastDigits ? `${hash}-${lastDigits}` : `${hash}`;

  return {
    prefix: formattedPrefix,
    hash: formattedHash
  };
};

export const isValidAccountHash = (
  accountHash?: string | null
): accountHash is string => {
  if (accountHash == null) {
    return false;
  }

  const validHashRegExp = new RegExp('^([0-9A-Fa-f]){64}$');
  return validHashRegExp.test(accountHash.trim());
};
