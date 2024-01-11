import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { TransferResult } from '@libs/services/account-activity-service/types';
import { queryClient } from '@libs/services/query-client';
import { PaginatedResponse, Payload } from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';

import { getAccountTransferLink } from './constants';

export const accountCasperActivityRequest = (
  casperApiUrl: string,
  accountHash: string,
  page: number,
  signal?: AbortSignal
): Promise<PaginatedResponse<TransferResult>> =>
  fetch(getAccountTransferLink(casperApiUrl, accountHash, page), { signal })
    .then(toJson)
    .catch(handleError);

export const fetchAccountCasperActivity = ({
  casperApiUrl,
  accountHash,
  page
}: {
  casperApiUrl: string;
  accountHash: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    ['accountCasperActivityRequest', casperApiUrl, accountHash, page],
    ({ signal }) =>
      accountCasperActivityRequest(casperApiUrl, accountHash, page, signal),
    { staleTime: ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE }
  );

export const dispatchFetchAccountCasperActivity = (
  accountHash: string,
  page: number
): Promise<Payload<PaginatedResponse<TransferResult>>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountCasperActivityRequest({ accountHash, page })
  );
