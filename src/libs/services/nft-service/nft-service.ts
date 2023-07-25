import { getNftTokensUrl } from '@libs/services/nft-service/constants';
import { handleError, toJson } from '@libs/services/utils';
import { PaginatedResponse } from '@libs/services/types';
import { NFTTokenResult } from '@libs/services/nft-service/types';
import { queryClient } from '@libs/services/query-client';
import { NFT_TOKENS_REFRESH_RATE } from '@src/constants';
import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

export const nftTokensRequest = (
  casperApiUrl: string,
  accountHash: string,
  page: number
): Promise<PaginatedResponse<NFTTokenResult>> =>
  fetch(getNftTokensUrl(casperApiUrl, accountHash, page))
    .then(toJson)
    .catch(handleError);

export const fetchNftTokens = ({
  casperApiUrl,
  accountHash,
  page
}: {
  casperApiUrl: string;
  accountHash: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    ['getNftTokens', accountHash, casperApiUrl, page],
    () => nftTokensRequest(casperApiUrl, accountHash, page),
    { staleTime: NFT_TOKENS_REFRESH_RATE }
  );

export const dispatchFetchNftTokensRequest = (
  accountHash: string,
  page: number
): Promise<PaginatedResponse<NFTTokenResult>> =>
  dispatchToMainStore(
    serviceMessage.fetchNftTokensRequest({ accountHash, page })
  );
