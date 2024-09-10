import { IDeploy } from 'casper-wallet-core';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';
import { deploysRepository } from '@background/wallet-repositories';

import { queryClient } from '@libs/services/query-client';
import { Payload } from '@libs/services/types';

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
