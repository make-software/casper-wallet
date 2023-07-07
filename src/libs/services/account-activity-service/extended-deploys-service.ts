import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload, PaginatedResponse } from '@libs/services/types';
import { ACCOUNT_DEPLOY_REFRESH_RATE } from '@src/constants';

import { ExtendedDeploy, ExtendedDeployResult } from './types';
import {
  getAccountExtendedDeploysLink,
  getExtendedDeploysHashLink
} from './constants';

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
): Promise<DataWithPayload<ExtendedDeploy>> =>
  dispatchToMainStore(
    serviceMessage.fetchExtendedDeploysInfoRequest({ deployHash })
  );

export const accountExtendedDeploysRequest = (
  casperApiUrl: string,
  publicKey: string,
  page: number
): Promise<PaginatedResponse<ExtendedDeployResult>> =>
  fetch(getAccountExtendedDeploysLink(casperApiUrl, publicKey, page))
    .then(toJson)
    .catch(handleError);

export const fetchAccountExtendedDeploys = ({
  casperApiUrl,
  publicKey,
  page
}: {
  casperApiUrl: string;
  publicKey: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    ['accountDeploysRequest', casperApiUrl, publicKey, page],
    () => accountExtendedDeploysRequest(casperApiUrl, publicKey, page),
    { staleTime: ACCOUNT_DEPLOY_REFRESH_RATE }
  );

export const dispatchFetchAccountExtendedDeploys = (
  publicKey: string,
  page: number
): Promise<DataWithPayload<PaginatedResponse<ExtendedDeploy>>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountExtendedDeploysRequest({ publicKey, page })
  );
