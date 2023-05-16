import { handleError, toJson } from '@libs/services/utils';
import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload } from '@libs/services/types';
import {
  Transaction,
  getAccountTransfersLink
} from '@libs/services/transactions-service';

export const transactionsRequest = (
  casperApiUrl: string,
  accountHash: string
) =>
  fetch(getAccountTransfersLink(accountHash, casperApiUrl))
    .then(toJson)
    .catch(handleError);

export const fetchAccountTransactions = ({
  accountHash,
  casperApiUrl
}: {
  accountHash: string;
  casperApiUrl: string;
}) =>
  queryClient.fetchQuery(
    ['accountTransactionsRequest', accountHash, casperApiUrl],
    () => transactionsRequest(casperApiUrl, accountHash)
  );

export const dispatchFetchAccountTransactions = (
  accountHash: string
): Promise<DataWithPayload<Transaction[]>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountTransactionsRequest({ accountHash })
  );
