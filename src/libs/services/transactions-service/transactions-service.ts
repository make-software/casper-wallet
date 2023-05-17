import { handleError, toJson } from '@libs/services/utils';
import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload } from '@libs/services/types';
import {
  getAccountTransfersLink,
  GetAccountTransactionsResponse
} from '@libs/services/transactions-service';

export const transactionsRequest = (
  casperApiUrl: string,
  accountHash: string,
  page: number
) =>
  fetch(getAccountTransfersLink(accountHash, casperApiUrl, page))
    .then(toJson)
    .catch(handleError);

export const fetchAccountTransactions = ({
  accountHash,
  casperApiUrl,
  page
}: {
  accountHash: string;
  casperApiUrl: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    ['accountTransactionsRequest', accountHash, casperApiUrl, page],
    () => transactionsRequest(casperApiUrl, accountHash, page)
  );

export const dispatchFetchAccountTransactions = (
  accountHash: string,
  page: number
): Promise<DataWithPayload<GetAccountTransactionsResponse>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountTransactionsRequest({ accountHash, page })
  );
