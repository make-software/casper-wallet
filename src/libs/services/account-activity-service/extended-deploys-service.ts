import { CloudPaginatedResponse, IDeploy } from 'casper-wallet-core';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';

import { ACCOUNT_DEPLOY_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';
import { deploysRepository } from '@background/wallet-repositories';

import { queryClient } from '@libs/services/query-client';
import { ErrorResponse, Payload } from '@libs/services/types';

export const fetchExtendedDeploysInfo = ({
  casperClarityApiUrl,
  deployHash,
  publicKey,
  network
}: {
  casperClarityApiUrl: string;
  deployHash: string;
  publicKey: string;
  network: CasperNetwork;
}) =>
  queryClient.fetchQuery(
    ['getSingleDeploy', casperClarityApiUrl, deployHash, network],
    () =>
      deploysRepository.getSingleDeploy({
        deployHash,
        network,
        activePublicKey: publicKey
      })
  );

export const dispatchFetchExtendedDeploysInfo = (
  deployHash: string,
  publicKey: string
): Promise<Payload<IDeploy | null>> =>
  dispatchToMainStore(
    serviceMessage.fetchExtendedDeploysInfoRequest({ deployHash, publicKey })
  );

// TODO just a quick example. Errors handling required
export const fetchAccountExtendedDeploys = ({
  casperClarityApiUrl,
  publicKey,
  page,
  network
}: {
  casperClarityApiUrl: string;
  publicKey: string;
  page: number;
  network: CasperNetwork;
}): Promise<CloudPaginatedResponse<IDeploy>> =>
  queryClient.fetchQuery(
    ['getDeploys', casperClarityApiUrl, publicKey, page, network],
    () =>
      deploysRepository.getDeploys({
        page,
        activePublicKey: publicKey,
        network
      }),
    { staleTime: ACCOUNT_DEPLOY_REFRESH_RATE }
  );

export const dispatchFetchAccountExtendedDeploys = (
  publicKey: string,
  page: number
): Promise<Payload<CloudPaginatedResponse<IDeploy> | ErrorResponse>> =>
  dispatchToMainStore(
    serviceMessage.fetchAccountExtendedDeploysRequest({ publicKey, page })
  );
