import { serviceMessage } from '@background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload, PaginatedResponse } from '@libs/services/types';
import { ERC20_ACTIVITY_REFRESH_RATE } from '@src/constants';

import { getErc20TokenActivityLink } from './constants';
import { Erc20TokenActionResult } from './types';

export const erc20TokenActivityRequest = (
  casperApiUrl: string,
  publicKey: string,
  contractPackageHash: string,
  page: number
) =>
  fetch(
    getErc20TokenActivityLink(
      casperApiUrl,
      publicKey,
      contractPackageHash,
      page
    )
  )
    .then(toJson)
    .catch(handleError);

export const fetchErc20TokenActivity = ({
  casperApiUrl,
  publicKey,
  contractPackageHash,
  page
}: {
  casperApiUrl: string;
  publicKey: string;
  contractPackageHash: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    [
      'erc20TokenActivityRequest',
      casperApiUrl,
      publicKey,
      contractPackageHash,
      page
    ],
    () =>
      erc20TokenActivityRequest(
        casperApiUrl,
        publicKey,
        contractPackageHash,
        page
      ),
    { staleTime: ERC20_ACTIVITY_REFRESH_RATE }
  );

export const dispatchFetchErc20TokenActivity = (
  publicKey: string,
  contractPackageHash: string,
  page: number
): Promise<DataWithPayload<PaginatedResponse<Erc20TokenActionResult>>> =>
  dispatchToMainStore(
    serviceMessage.fetchErc20TokenActivityRequest({
      publicKey,
      contractPackageHash,
      page
    })
  );
