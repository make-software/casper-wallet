import { serviceMessage } from '@background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { Payload, PaginatedResponse } from '@libs/services/types';
import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';
import { TransferResult } from '@libs/services/account-activity-service/types';

import { getAccountTransferLink } from './constants';

export const accountCasperActivityRequest = (
  casperApiUrl: string,
  accountHash: string,
  page: number
): Promise<PaginatedResponse<TransferResult>> =>
  fetch(getAccountTransferLink(casperApiUrl, accountHash, page))
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
    () => accountCasperActivityRequest(casperApiUrl, accountHash, page),
    { staleTime: ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE }
  );

export const dispatchFetchAccountCasperActivity = (
  accountHash: string,
  page: number
): Promise<Payload<PaginatedResponse<TransferResult>>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountCasperActivityRequest({ accountHash, page })
  );
