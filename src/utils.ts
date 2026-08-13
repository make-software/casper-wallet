import Big from 'big.js';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import { getAccountHashFromPublicKey } from 'casper-wallet-core/src/utils/casperSdk/accountHash';

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

// Anchored at BOTH ends, over a charset that cannot express markup. A bare
// `^/?assets/` prefix test puts no constraint on the remainder, so an
// API-supplied `assets/<svg onload=…></svg>` satisfies it and reaches the
// inliner — `<`, `>`, spaces, quotes, `?`, `#`, `:` and `,` are all excluded,
// and requiring a final `.ext` also rejects `..` traversal segments.
const bundledAssetPathRegex = /^\/?assets\/(?:[\w-]+\/)*[\w.-]+\.[a-z0-9]+$/i;

/**
 * Whether a src points at a file webpack bundled into the extension.
 *
 * This is an allow-list on purpose, and it is the inverse of how the routing
 * used to work. SvgIcon is react-inlinesvg, which injects `data:image/svg+xml`
 * payloads and raw `<svg …>` strings straight into the DOM without any fetch —
 * so connect-src never sees them. Deciding "is this ours" rather than "is this
 * remote" keeps every unrecognised shape out of the inliner by default.
 *
 * The allow-list has to constrain the WHOLE string, not just its prefix: the
 * shape it is guarding against is markup, and `assets/<svg …>` is both a valid
 * prefix match and a payload react-inlinesvg inlines verbatim.
 */
export const isBundledAssetPath = (src: string) =>
  bundledAssetPathRegex.test(src);

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
    // Same accept/reject set as `PublicKey.fromHex`, without linking the SDK: core's derivation
    // throws on exactly the inputs the SDK rejects, and its parity with the SDK is pinned by
    // tests that use the SDK itself as the oracle.
    getAccountHashFromPublicKey(publicKey);
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

/**
 * Safari ships no manifest CSP — getCSP() in webpack.config.js has no Safari
 * branch, so the <meta> this builds IS the whole policy. Exported so a test can
 * pin it: sharing `baseDirectives` with the other targets is what keeps the
 * policies from drifting, but it also means an edit to src/csp.json silently
 * changes what Safari enforces.
 */
export const getSafariCspContent = () =>
  `${cspConfig.baseDirectives}; style-src 'unsafe-inline'; connect-src ${cspConfig.connectSrc.join(' ')}`;

export const setCSPForSafari = () => {
  if (isSafariBuild) {
    const metaTag = document.querySelector('[http-equiv]');

    if (metaTag == null) {
      const meta = document.createElement('meta');

      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      // Shared directives (img-src/media-src included) come from src/csp.json
      // so they cannot drift from the other targets again; only the style
      // arm is Safari-specific.
      // Note: frame-ancestors inside a <meta http-equiv> is ignored by browsers;
      // it is present for parity with the built manifests, not as protection.
      meta.setAttribute('content', getSafariCspContent());

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
