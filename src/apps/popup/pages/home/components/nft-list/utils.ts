import {
  NFTTokenMetadata,
  NFTTokenMetadataEntry,
  NFTTokenResult
} from '@libs/services/nft-service';
import { mapToDictionary } from '@src/utils';
import { queryClient } from '@libs/services/query-client';
import { NFT_TOKENS_REFRESH_RATE } from '@src/constants';

interface ImageProxyUrlProps {
  ttl: string;
  width?: string | number;
}

export const listToDictionary = <T extends any>(obj: any): T => {
  return Object.entries(obj).map(item => ({
    key: item[0] as string,
    value:
      typeof item[1] === 'object'
        ? JSON.stringify(item[1])
        : (item[1] as string)
  })) as T;
};

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
  nftToken: NFTTokenResult | null
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

export const deriveMediaType = async (url: string | undefined) => {
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

      return {
        type: type
      };
    } catch (error) {
      console.error(error);
    }
  }

  return {
    type: ''
  };
};

export const getImageProxyUrl = (
  url: string | undefined,
  { ttl, width }: ImageProxyUrlProps
) => {
  if (!url) {
    return undefined;
  }

  return `https://image-proxy-cdn.dev.make.services/${width},fit,ttl${ttl}/${url}`;
};
