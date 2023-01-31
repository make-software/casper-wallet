import browser from 'webextension-polyfill';

import { serviceMessage } from '@background/service-message';

import {
  ACCOUNTS_INFO_URL,
  getAccountInfoUrl,
  AccountInfo,
  AccountInfoResponse
} from '@libs/services/account-info';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload } from '@libs/services/types';

import { SECOND } from '@src/constants';

const getAccountInfoRequest = (
  accountHash: string
): Promise<AccountInfoResponse<AccountInfo>> =>
  fetch(getAccountInfoUrl({ accountHash })).then(toJson).catch(handleError);

const getAccountsInfoRequest = (
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

export const getAccountInfo = ({ accountHash }: { accountHash: string }) =>
  queryClient.fetchQuery(
    ['getAccountInfoRequest', accountHash],
    () => getAccountInfoRequest(accountHash),
    {
      // cached for 30 sec
      staleTime: 30 * SECOND
    }
  );

export const getAccountsInfo = ({ accountsHash }: { accountsHash: string[] }) =>
  queryClient.fetchQuery(
    ['getAccountsInfoRequest', accountsHash],
    () => getAccountsInfoRequest(accountsHash),
    {
      // cached for 30 sec
      staleTime: 30 * SECOND
    }
  );
export const getActiveAccountInfo = (
  accountHash: string
): Promise<DataWithPayload<AccountInfo>> =>
  browser.runtime.sendMessage(
    serviceMessage.fetchAccountInfoRequest({ accountHash })
  );

export const getAllAccountsInfo = (
  accountsHash: string[]
): Promise<DataWithPayload<AccountInfo[]>> =>
  browser.runtime.sendMessage(
    serviceMessage.fetchAccountsInfoRequest({ accountsHash })
  );
