import { FETCH_QUERY_OPTIONS } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { AccountInfo, getAccountInfoUrl } from '@libs/services/account-info';
import { queryClient } from '@libs/services/query-client';
import { DataResponse, Payload } from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';

const accountInfoRequest = (
  accountHash: string,
  casperClarityApiUrl: string,
  signal?: AbortSignal
): Promise<DataResponse<AccountInfo>> =>
  fetch(getAccountInfoUrl({ accountHash, casperClarityApiUrl }), {
    signal
  })
    .then(toJson)
    .catch(handleError);

export const fetchAccountInfo = ({
  accountHash,
  casperClarityApiUrl
}: {
  accountHash: string;
  casperClarityApiUrl: string;
}) =>
  queryClient.fetchQuery(
    ['accountInfoRequest', accountHash, casperClarityApiUrl],
    ({ signal }) =>
      accountInfoRequest(accountHash, casperClarityApiUrl, signal),
    {
      staleTime: FETCH_QUERY_OPTIONS.apiCacheTime
    }
  );

export const dispatchFetchAccountInfoRequest = (
  accountHash: string
): Promise<Payload<AccountInfo>> =>
  dispatchToMainStore(serviceMessage.fetchAccountInfoRequest({ accountHash }));
