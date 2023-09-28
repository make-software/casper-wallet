import { getNftTokensUrl } from '@libs/services/nft-service/constants';
import { handleError, toJson } from '@libs/services/utils';
import {
  Payload,
  ErrorResponse,
  PaginatedResponse
} from '@libs/services/types';
import { NFTTokenResult } from '@libs/services/nft-service/types';
import { queryClient } from '@libs/services/query-client';
import { NFT_TOKENS_REFRESH_RATE } from '@src/constants';
import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

export const nftTokensRequest = (
  casperApiUrl: string,
  accountHash: string,
  page: number,
  signal?: AbortSignal
): Promise<PaginatedResponse<NFTTokenResult>> =>
  fetch(getNftTokensUrl(casperApiUrl, accountHash, page), { signal })
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
}): Promise<PaginatedResponse<NFTTokenResult> | ErrorResponse> =>
  queryClient.fetchQuery(
    ['getNftTokens', accountHash, casperApiUrl, page],
    ({ signal }) => nftTokensRequest(casperApiUrl, accountHash, page, signal),
    { staleTime: NFT_TOKENS_REFRESH_RATE }
  );

export const dispatchFetchNftTokensRequest = (
  accountHash: string,
  page: number
): Promise<Payload<PaginatedResponse<NFTTokenResult> | ErrorResponse>> =>
  dispatchToMainStore(
    serviceMessage.fetchNftTokensRequest({ accountHash, page })
  );
