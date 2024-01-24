import { NFT_TOKENS_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { getNftTokensUrl } from '@libs/services/nft-service/constants';
import { NFTTokenResult } from '@libs/services/nft-service/types';
import { queryClient } from '@libs/services/query-client';
import {
  ErrorResponse,
  PaginatedResponse,
  Payload
} from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';

export const nftTokensRequest = (
  casperClarityApiUrl: string,
  accountHash: string,
  page: number,
  signal?: AbortSignal
): Promise<PaginatedResponse<NFTTokenResult>> =>
  fetch(getNftTokensUrl(casperClarityApiUrl, accountHash, page), { signal })
    .then(toJson)
    .catch(handleError);

export const fetchNftTokens = ({
  casperClarityApiUrl,
  accountHash,
  page
}: {
  casperClarityApiUrl: string;
  accountHash: string;
  page: number;
}): Promise<PaginatedResponse<NFTTokenResult> | ErrorResponse> =>
  queryClient.fetchQuery(
    ['getNftTokens', accountHash, casperClarityApiUrl, page],
    ({ signal }) =>
      nftTokensRequest(casperClarityApiUrl, accountHash, page, signal),
    { staleTime: NFT_TOKENS_REFRESH_RATE }
  );

export const dispatchFetchNftTokensRequest = (
  accountHash: string,
  page: number
): Promise<Payload<PaginatedResponse<NFTTokenResult> | ErrorResponse>> =>
  dispatchToMainStore(
    serviceMessage.fetchNftTokensRequest({ accountHash, page })
  );
