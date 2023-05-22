import { serviceMessage } from '@background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload, PaginatedResponse } from '@libs/services/types';

import { getAccountActivityLink } from './constants';
import { LedgerLiveDeploysResult } from './types';

export const accountActivityRequest = (publicKey: string, page: number) =>
  fetch(getAccountActivityLink(publicKey, page))
    .then(toJson)
    .catch(handleError);

export const fetchAccountActivity = ({
  publicKey,
  page
}: {
  publicKey: string;
  page: number;
}) =>
  queryClient.fetchQuery(['accountTransactionsRequest', publicKey, page], () =>
    accountActivityRequest(publicKey, page)
  );

export const dispatchFetchAccountActivity = (
  publicKey: string,
  page: number
): Promise<DataWithPayload<PaginatedResponse<LedgerLiveDeploysResult>>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountActivityRequest({ publicKey, page })
  );
