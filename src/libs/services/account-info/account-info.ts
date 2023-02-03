import { serviceMessage } from '@background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  ACCOUNTS_INFO_URL,
  getAccountInfoUrl,
  AccountInfo,
  AccountInfoResponse
} from '@libs/services/account-info';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload } from '@libs/services/types';

import { FETCH_QUERY_OPTIONS } from '@src/constants';

const accountInfoRequest = (
  accountHash: string
): Promise<AccountInfoResponse<AccountInfo>> =>
  fetch(getAccountInfoUrl({ accountHash })).then(toJson).catch(handleError);

const accountListInfoRequest = (
  accountsHash: string[]
): Promise<AccountInfoResponse<AccountInfo[]>> =>
  fetch(ACCOUNTS_INFO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ account_hash: accountsHash })
  })
    .then(toJson)
    .catch(handleError);

export const fetchAccountInfo = ({ accountHash }: { accountHash: string }) =>
  queryClient.fetchQuery(
    ['accountInfoRequest', accountHash],
    () => accountInfoRequest(accountHash),
    {
      staleTime: FETCH_QUERY_OPTIONS.apiCacheTime
    }
  );

export const fetchAccountListInfo = ({
  accountsHash
}: {
  accountsHash: string[];
}) =>
  queryClient.fetchQuery(
    ['accountListInfoRequest', accountsHash],
    () => accountListInfoRequest(accountsHash),
    {
      staleTime: FETCH_QUERY_OPTIONS.apiCacheTime
    }
  );
export const dispatchActiveAccountInfo = (
  accountHash: string
): Promise<DataWithPayload<AccountInfo>> =>
  dispatchToMainStore(serviceMessage.fetchAccountInfoRequest({ accountHash }));

export const dispatchAccountListInfo = (
  accountsHash: string[]
): Promise<DataWithPayload<AccountInfo[]>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountListInfoRequest({ accountsHash })
  );
