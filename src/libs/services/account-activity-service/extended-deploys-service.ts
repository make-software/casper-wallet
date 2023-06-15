import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload } from '@libs/services/types';

import { ExtendedDeployResult } from './types';
import { getExtendedDeploysHashLink } from './constants';

export const extendedDeploysRequest = (
  casperApiUrl: string,
  deployHash: string
): Promise<ExtendedDeployResult> =>
  fetch(getExtendedDeploysHashLink(casperApiUrl, deployHash))
    .then(toJson)
    .catch(handleError);

export const fetchExtendedDeploysInfo = ({
  casperApiUrl,
  deployHash
}: {
  casperApiUrl: string;
  deployHash: string;
}) =>
  queryClient.fetchQuery(
    ['accountTransactionsRequest', casperApiUrl, deployHash],
    () => extendedDeploysRequest(casperApiUrl, deployHash)
  );

export const dispatchFetchExtendedDeploysInfo = (
  deployHash: string
): Promise<DataWithPayload<ExtendedDeployResult>> =>
  dispatchToMainStore(
    serviceMessage.fetchExtendedDeploysInfoRequest({ deployHash })
  );
