import { serviceMessage } from '@background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';

import { getAccountInfoUrl, AccountInfo } from '@libs/services/account-info';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataResponse, Payload } from '@libs/services/types';

import { FETCH_QUERY_OPTIONS } from '@src/constants';

const accountInfoRequest = (
  accountHash: string,
  casperApiUrl: string,
  signal?: AbortSignal
): Promise<DataResponse<AccountInfo>> =>
  fetch(getAccountInfoUrl({ accountHash, casperApiUrl }), { signal })
    .then(toJson)
    .catch(handleError);

export const fetchAccountInfo = ({
  accountHash,
  casperApiUrl
}: {
  accountHash: string;
  casperApiUrl: string;
}) =>
  queryClient.fetchQuery(
    ['accountInfoRequest', accountHash, casperApiUrl],
    ({ signal }) => accountInfoRequest(accountHash, casperApiUrl, signal),
    {
      staleTime: FETCH_QUERY_OPTIONS.apiCacheTime
    }
  );

export const dispatchFetchAccountInfoRequest = (
  accountHash: string
): Promise<Payload<AccountInfo>> =>
  dispatchToMainStore(serviceMessage.fetchAccountInfoRequest({ accountHash }));
