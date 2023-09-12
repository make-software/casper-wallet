import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import {
  Payload,
  PaginatedResponse,
  ErrorResponse
} from '@libs/services/types';
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
): Promise<Payload<ExtendedDeploy>> =>
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
}): Promise<PaginatedResponse<ExtendedDeployResult> | ErrorResponse> =>
  queryClient.fetchQuery(
    ['accountDeploysRequest', casperApiUrl, publicKey, page],
    () => accountExtendedDeploysRequest(casperApiUrl, publicKey, page),
    { staleTime: ACCOUNT_DEPLOY_REFRESH_RATE }
  );

export const dispatchFetchAccountExtendedDeploys = (
  publicKey: string,
  page: number
): Promise<Payload<PaginatedResponse<ExtendedDeploy> | ErrorResponse>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountExtendedDeploysRequest({ publicKey, page })
  );
