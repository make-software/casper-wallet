import { CloudPaginatedResponse, IDeploy } from 'casper-wallet-core';

import { ACCOUNT_DEPLOY_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';
import { deploysRepository } from '@background/wallet-repositories';

import { queryClient } from '@libs/services/query-client';
import {
  ErrorResponse,
  PaginatedResponse,
  Payload
} from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';

import { getExtendedDeploysHashLink } from './constants';
import { ExtendedDeploy, ExtendedDeployResult } from './types';

export const extendedDeploysRequest = (
  casperClarityApiUrl: string,
  deployHash: string,
  signal?: AbortSignal
): Promise<ExtendedDeployResult> =>
  fetch(getExtendedDeploysHashLink(casperClarityApiUrl, deployHash), { signal })
    .then(toJson)
    .catch(handleError);

export const fetchExtendedDeploysInfo = ({
  casperClarityApiUrl,
  deployHash
}: {
  casperClarityApiUrl: string;
  deployHash: string;
}) =>
  queryClient.fetchQuery(
    ['accountTransactionsRequest', casperClarityApiUrl, deployHash],
    ({ signal }) =>
      extendedDeploysRequest(casperClarityApiUrl, deployHash, signal)
  );

export const dispatchFetchExtendedDeploysInfo = (
  deployHash: string
): Promise<Payload<ExtendedDeploy>> =>
  dispatchToMainStore(
    serviceMessage.fetchExtendedDeploysInfoRequest({ deployHash })
  );

// TODO just a quick example. Errors handling required
export const fetchAccountExtendedDeploys = ({
  casperClarityApiUrl,
  publicKey,
  page
}: {
  casperClarityApiUrl: string;
  publicKey: string;
  page: number;
}): Promise<CloudPaginatedResponse<IDeploy>> =>
  queryClient.fetchQuery(
    ['accountDeploysRequest', casperClarityApiUrl, publicKey, page],
    () =>
      deploysRepository.getDeploys({
        page,
        activePublicKey: publicKey,
        network: 'testnet'
      }),
    { staleTime: ACCOUNT_DEPLOY_REFRESH_RATE }
  );

export const dispatchFetchAccountExtendedDeploys = (
  publicKey: string,
  page: number
): Promise<Payload<PaginatedResponse<ExtendedDeploy> | ErrorResponse>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountExtendedDeploysRequest({ publicKey, page })
  );
