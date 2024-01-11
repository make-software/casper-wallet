import { ACCOUNT_DEPLOY_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { queryClient } from '@libs/services/query-client';
import {
  ErrorResponse,
  PaginatedResponse,
  Payload
} from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';

import {
  getAccountExtendedDeploysLink,
  getExtendedDeploysHashLink
} from './constants';
import { ExtendedDeploy, ExtendedDeployResult } from './types';

export const extendedDeploysRequest = (
  casperApiUrl: string,
  deployHash: string,
  signal?: AbortSignal
): Promise<ExtendedDeployResult> =>
  fetch(getExtendedDeploysHashLink(casperApiUrl, deployHash), { signal })
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
    ({ signal }) => extendedDeploysRequest(casperApiUrl, deployHash, signal)
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
  page: number,
  signal?: AbortSignal
): Promise<PaginatedResponse<ExtendedDeployResult>> =>
  fetch(getAccountExtendedDeploysLink(casperApiUrl, publicKey, page), {
    signal
  })
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
    ({ signal }) =>
      accountExtendedDeploysRequest(casperApiUrl, publicKey, page, signal),
    { staleTime: ACCOUNT_DEPLOY_REFRESH_RATE }
  );

export const dispatchFetchAccountExtendedDeploys = (
  publicKey: string,
  page: number
): Promise<Payload<PaginatedResponse<ExtendedDeploy> | ErrorResponse>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountExtendedDeploysRequest({ publicKey, page })
  );
