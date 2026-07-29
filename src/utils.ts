import Big from 'big.js';
import { KeyAlgorithm, PrivateKey, PublicKey } from 'casper-js-sdk';
import { Maybe } from 'casper-wallet-core/src/typings/common';

import { Browser } from '@src/constants';

import { CasperWalletSupports } from '@content/sdk-types';

import { Account, HardwareWalletType } from '@libs/types/account';

import cspConfig from './csp.json';

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
  CEP78 = 'CEP78',
  CEP95 = 'CEP95'
}

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

const RETINA_SCALE = 2;
const IMAGE_WIDTH = 376;
const CACHE_TTL = '2592000';

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
      // Safari ships no manifest CSP — getCSP() in webpack.config.js has no
      // Safari branch, so this <meta> IS the whole policy. Shared directives
      // come from src/csp.json so it cannot drift from the other targets again;
      // only the style arm is Safari-specific.
      // Note: frame-ancestors inside a <meta http-equiv> is ignored by browsers;
      // it is present for parity with the built manifests, not as protection.
      meta.setAttribute(
        'content',
        `${cspConfig.baseDirectives}; style-src 'unsafe-inline'; img-src https: data:; media-src https: data:; connect-src ${cspConfig.connectSrc.join(' ')}`
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

export const getActiveAccountSupports = (activeAccount: Account) => {
  return activeAccount.hardware === HardwareWalletType.Ledger
    ? [
        CasperWalletSupports.signDeploy,
        CasperWalletSupports.signMessage,
        CasperWalletSupports.messageEncryption,
        ...(activeAccount.supports?.includes(
          CasperWalletSupports.signTransactionV1
        )
          ? [CasperWalletSupports.signTransactionV1]
          : [])
      ]
    : [
        CasperWalletSupports.signDeploy,
        CasperWalletSupports.signMessage,
        CasperWalletSupports.signTypedDataEIP712,
        CasperWalletSupports.signTransactionV1,
        CasperWalletSupports.messageEncryption,
        CasperWalletSupports.messageDecryption
      ];
};
