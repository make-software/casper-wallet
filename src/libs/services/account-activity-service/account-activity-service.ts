import { serviceMessage } from '@background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload, PaginatedResponse } from '@libs/services/types';
import { ACCOUNT_ACTIVITY_REFRESH_RATE } from '@src/constants';

import { getAccountActivityLink } from './constants';
import { LedgerLiveDeploysResult } from './types';

export const accountActivityRequest = (
  casperApiUrl: string,
  publicKey: string,
  page: number
) =>
  fetch(getAccountActivityLink(casperApiUrl, publicKey, page))
    .then(toJson)
    .catch(handleError);

export const fetchAccountActivity = ({
  casperApiUrl,
  publicKey,
  page
}: {
  casperApiUrl: string;
  publicKey: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    ['accountActivityRequest', casperApiUrl, publicKey, page],
    () => accountActivityRequest(casperApiUrl, publicKey, page),
    { staleTime: ACCOUNT_ACTIVITY_REFRESH_RATE }
  );

export const dispatchFetchAccountActivity = (
  publicKey: string,
  page: number
): Promise<DataWithPayload<PaginatedResponse<LedgerLiveDeploysResult>>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountActivityRequest({ publicKey, page })
  );
