import Big from 'big.js';
import { CLPublicKey } from 'casper-js-sdk';

import { Browser, NFT_TOKENS_REFRESH_RATE } from '@src/constants';
import {
  NFTTokenMetadata,
  NFTTokenMetadataEntry,
  NFTTokenResult
} from '@libs/services/nft-service';
import { queryClient } from '@libs/services/query-client';
import browser from 'webextension-polyfill';

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

export const mapToDictionary = <T, V extends Record<string, any>>(
  data: V[]
): T =>
  data &&
  data.reduce(
    (prev, curr) => ({
      ...prev,
      [curr.key.trim()]: curr.value
    }),
    {} as T
  );

export const listToDictionary = <T extends any>(obj: any): T => {
  return Object.entries(obj).map(item => ({
    key: item[0] as string,
    value:
      typeof item[1] === 'object'
        ? JSON.stringify(item[1])
        : (item[1] as string)
  })) as T;
};

export const NFTTokenStandards = {
  CEP47: 1,
  CEP78: 2
};

export enum NFTTokenStandard {
  CEP47 = 'CEP-47',
  CEP78 = 'CEP-78'
}

export const MapNFTTokenStandardToName = {
  [NFTTokenStandards.CEP47]: NFTTokenStandard.CEP47,
  [NFTTokenStandards.CEP78]: NFTTokenStandard.CEP78
};

export const tryParseJSONObject = (jsonString: any) => {
  try {
    const o = JSON.parse(jsonString);

    // Handle non-exception-throwing cases:
    // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
    // but... JSON.parse(null) returns null, and typeof null === "object",
    // so we must check for that, too. Thankfully, null is falsey, so this suffices:
    if (o && typeof o === 'object') {
      return o;
    }
  } catch (e) {
    return false;
  }

  return false;
};

export const convertIpfsSourceAsLink = (
  metadata: NFTTokenMetadataEntry
): NFTTokenMetadataEntry => {
  const isIpfsKey = new RegExp(`ipfs`, 'gi').test(metadata.key);
  const isIpfsValue = new RegExp(`ipfs://`, 'gi').test(metadata.value);
  const isLinkValue = new RegExp(`http://|https://`, 'gi').test(metadata.value);

  let value = metadata.value;
  if (isIpfsValue) {
    value = metadata.value.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  if (isIpfsKey) {
    value = isLinkValue
      ? metadata.value
      : 'https://ipfs.io/ipfs/' + metadata.value;
  }

  return {
    key: metadata.key,
    value: value
  };
};

export type ContentType = string | 'unknown';

export const deriveMediaType = async (
  url: string | undefined
): Promise<ContentType> => {
  if (url) {
    try {
      const response = await queryClient.fetchQuery(
        ['deriveMediaType', url],
        () => fetch(url, { method: 'HEAD' }),
        {
          staleTime: NFT_TOKENS_REFRESH_RATE
        }
      );
      const type = response.headers.get('Content-Type');

      if (!type) {
        return 'unknown';
      }

      const isKnownType = /^(image|video|audio)/.test(type);

      return isKnownType ? type : 'unknown';
    } catch (error) {
      console.error(error);
    }
  }

  return 'unknown';
};

export const isSafariExtension = browser.runtime.id.startsWith(
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

export const deriveMetadataFromToken = (
  nftToken: NFTTokenResult
): NFTTokenMetadataEntry[] => {
  const onChain =
    nftToken && nftToken?.onchain_metadata ? nftToken?.onchain_metadata : {};
  const offChain =
    nftToken && nftToken?.offchain_metadata ? nftToken?.offchain_metadata : {};

  // Order here is important
  return [
    ...listToDictionary<any>(offChain),
    ...listToDictionary<any>(onChain)
  ];
};

export const getNftTokenMetadataWithLinks = (
  nftToken: NFTTokenResult | null | undefined
) => {
  return !nftToken
    ? []
    : deriveMetadataFromToken(nftToken)
        ?.map(convertIpfsSourceAsLink)
        .filter(item => !tryParseJSONObject(item.value));
};

export const getMetadataKeyValue = (
  nftTokenMetadataWithLinks: NFTTokenMetadataEntry[]
) =>
  !nftTokenMetadataWithLinks
    ? null
    : mapToDictionary<NFTTokenMetadata, NFTTokenMetadataEntry>(
        nftTokenMetadataWithLinks
      );

export const findMediaPreview = (metadata: NFTTokenMetadataEntry): boolean => {
  const hasImageExtension = new RegExp(
    /\w+\.(jpg|jpeg|png|svg|gif)/,
    'gi'
  ).test(metadata.value);
  const knownImageKey = new RegExp(
    `pictureIpfs|image|imageUrl|image_url|asset|ipfs_url|token_uri`,
    'gi'
  ).test(metadata.key);

  return hasImageExtension || knownImageKey;
};
