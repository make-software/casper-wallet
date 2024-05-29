import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { TransferResult } from '@libs/services/account-activity-service/types';
import { queryClient } from '@libs/services/query-client';
import { PaginatedResponse, Payload } from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';

import { getAccountTransferLink } from './constants';

export const accountCasperActivityRequest = (
  casperClarityApiUrl: string,
  accountHash: string,
  page: number,
  signal?: AbortSignal
): Promise<PaginatedResponse<TransferResult>> =>
  fetch(getAccountTransferLink(casperClarityApiUrl, accountHash, page), {
    signal
  })
    .then(toJson)
    .catch(handleError);

export const fetchAccountCasperActivity = ({
  casperClarityApiUrl,
  accountHash,
  page
}: {
  casperClarityApiUrl: string;
  accountHash: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    ['accountCasperActivityRequest', casperClarityApiUrl, accountHash, page],
    ({ signal }) =>
      accountCasperActivityRequest(
        casperClarityApiUrl,
        accountHash,
        page,
        signal
      ),
    { staleTime: ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE }
  );

export const dispatchFetchAccountCasperActivity = (
  accountHash: string,
  page: number
): Promise<Payload<PaginatedResponse<TransferResult>>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountCasperActivityRequest({ accountHash, page })
  );
