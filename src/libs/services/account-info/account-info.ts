import { serviceMessage } from '@background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  getAccountsInfoUrl,
  getAccountInfoUrl,
  AccountInfo,
  AccountInfoResponse
} from '@libs/services/account-info';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload } from '@libs/services/types';

import { FETCH_QUERY_OPTIONS } from '@src/constants';

const accountInfoRequest = (
  accountHash: string,
  casperApiUrl: string
): Promise<AccountInfoResponse<AccountInfo>> =>
  fetch(getAccountInfoUrl({ accountHash, casperApiUrl }))
    .then(toJson)
    .catch(handleError);

const accountListInfoRequest = (
  accountsHash: string[],
  casperApiUrl: string
): Promise<AccountInfoResponse<AccountInfo[]>> =>
  fetch(getAccountsInfoUrl(casperApiUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ account_hash: accountsHash })
  })
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
    () => accountInfoRequest(accountHash, casperApiUrl),
    {
      staleTime: FETCH_QUERY_OPTIONS.apiCacheTime
    }
  );

export const fetchAccountListInfo = ({
  accountsHash,
  casperApiUrl
}: {
  accountsHash: string[];
  casperApiUrl: string;
}) =>
  queryClient.fetchQuery(
    ['accountListInfoRequest', accountsHash, casperApiUrl],
    () => accountListInfoRequest(accountsHash, casperApiUrl),
    {
      staleTime: FETCH_QUERY_OPTIONS.apiCacheTime
    }
  );

export const dispatchFetchAccountInfoRequest = (
  accountHash: string
): Promise<DataWithPayload<AccountInfo>> =>
  dispatchToMainStore(serviceMessage.fetchAccountInfoRequest({ accountHash }));

export const dispatchFetchAccountListInfo = (
  accountsHash: string[]
): Promise<DataWithPayload<AccountInfo[]>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountListInfoRequest({ accountsHash })
  );
