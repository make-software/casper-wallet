import Big from 'big.js';
import { KeyAlgorithm, PrivateKey, PublicKey } from 'casper-js-sdk';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import { runtime } from 'webextension-polyfill';

import { Browser } from '@src/constants';

import { Account } from '@libs/types/account';

interface ImageProxyUrlProps {
  ttl: string;
  width?: string | number;
}

const httpPrefixRegex = /^https?:\/\//;

export const hasHttpPrefix = (url: string) => httpPrefixRegex.test(url);

export const getUrlOrigin = (url: string | undefined) => {
  if (!url) {
    return undefined;
  }
  return new URL(url).origin;
};

export const isSafariBuild = process.env.BROWSER === Browser.Safari;
export const isFirefoxBuild = process.env.BROWSER === Browser.Firefox;
export const isChromeBuild = process.env.BROWSER === Browser.Chrome;

export const isLedgerAvailable =
  process.env.BROWSER === Browser.Chrome ||
  process.env.BROWSER === Browser.Edge;

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
    PublicKey.fromHex(publicKey).toHex(false);
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

const validHashRegExp = new RegExp('^([0-9A-Fa-f]){64}$');

export const isValidAccountHash = (
  accountHash?: string | null
): accountHash is string => {
  if (accountHash == null) {
    return false;
  }

  return validHashRegExp.test(accountHash.trim());
};

/** It's for old accounts that possible can have mixed private and public keys in secretKey */
export const getPrivateKeyHexFromSecretKey = (secretKeyHex: string) => {
  return secretKeyHex.substring(0, 64);
};

/*
 * This function checks if the provided secretKey is a valid hash key.
 * Firstly, it checks if the secretKey is not an empty string.
 * Then, it tests the secretKey against the defined regular expression using test() method.
 * If the secretKey passes these checks, it attempts to parse and decode it as a 'raw' type private key.
 * If no exceptions occur during parsing and decoding, the function returns true indicating the secretKey is valid.
 * If the secretKey fails any of these checks or an exception is caught during parsing/decoding,
 * false is returned indicating the secretKey is invalid.
 */
export const isValidSecretKeyHash = (secretKey: string) => {
  if (!secretKey) {
    return false;
  }

  if (!validHashRegExp.test(secretKey.trim())) {
    return false;
  }

  try {
    PrivateKey.fromHex(
      getPrivateKeyHexFromSecretKey(secretKey),
      KeyAlgorithm.SECP256K1
    );

    return true;
  } catch (error) {
    return false;
  }
};

export enum NFTTokenStandard {
  CEP47 = 'CEP47',
  CEP78 = 'CEP78'
}

export const isSafariExtension = runtime.id.startsWith(
  'software.make.Casper-Wallet.Extension'
);

export const getImageProxyUrl = (
  url: string | undefined,
  { ttl, width }: ImageProxyUrlProps = {
    ttl: CACHE_TTL,
    width: IMAGE_WIDTH * RETINA_SCALE
  }
) => {
  if (!url) {
    return undefined;
  }

  return `https://image-proxy-cdn.make.services/${width},fit,ttl${ttl}/${url}`;
};

export const RETINA_SCALE = 2;
export const IMAGE_WIDTH = 376;
export const CACHE_TTL = '2592000';

// TODO: use isKeysEqual form casper wallet core
export const isEqualCaseInsensitive = (key1: string, key2: string) => {
  if (!(key1 && key2)) {
    return false;
  }

  return key1.toLowerCase() === key2.toLowerCase();
};

export const getSigningAccount = (
  accounts: Account[],
  signingPublicKeyHex: string
) =>
  accounts.find(account =>
    isEqualCaseInsensitive(account.publicKey, signingPublicKeyHex)
  );

export const setCSPForSafari = () => {
  if (isSafariBuild) {
    const metaTag = document.querySelector('[http-equiv]');

    if (metaTag == null) {
      const meta = document.createElement('meta');

      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      meta.setAttribute(
        'content',
        `default-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src https: data:; media-src https: data:; connect-src https://event-store-api-clarity-testnet.make.services https://event-store-api-clarity-mainnet.make.services https://casper-assets.s3.amazonaws.com/ https://image-proxy-cdn.make.services/ https://node.cspr.cloud/ https://node.testnet.cspr.cloud/ https://api.testnet.casperwallet.io/ https://api.mainnet.casperwallet.io/ https://cspr-wallet-api-condor.dev.make.services/ https://onramp-api.cspr.click/api/ https://cspr-wallet-api.dev.make.services/ https://cspr-api-gateway.dev.make.services/cspr-node-proxy-rpc-dev-condor/ http://44.197.182.12:7777/ https://cspr-wallet-api-condor.dev.make.services/`
      );

      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }
};

export const getErrorMessageForIncorrectPassword = (attemptsLeft: number) =>
  attemptsLeft === 1
    ? 'Password is incorrect. You’ve got last attempt, after that you’ll have to wait for 5 mins'
    : `Password is incorrect. You’ve got ${attemptsLeft} attempts, after that you’ll have to wait for 5 mins`;

export const isPublicKeyHash = (hash?: Maybe<string>) => {
  return hash?.startsWith('01') || hash?.startsWith('02');
};
