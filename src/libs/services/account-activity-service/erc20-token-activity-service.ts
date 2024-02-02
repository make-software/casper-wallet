import { ERC20_TOKEN_ACTIVITY_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { queryClient } from '@libs/services/query-client';
import { PaginatedResponse, Payload } from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';

import { getErc20TokenActivityLink } from './constants';
import { Erc20TokenActionResult } from './types';

export const erc20TokenActivityRequest = (
  casperClarityApiUrl: string,
  publicKey: string,
  contractPackageHash: string,
  page: number
) =>
  fetch(
    getErc20TokenActivityLink(
      casperClarityApiUrl,
      publicKey,
      contractPackageHash,
      page
    )
  )
    .then(toJson)
    .catch(handleError);

export const fetchErc20TokenActivity = ({
  casperClarityApiUrl,
  publicKey,
  contractPackageHash,
  page
}: {
  casperClarityApiUrl: string;
  publicKey: string;
  contractPackageHash: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    [
      'erc20TokenActivityRequest',
      casperClarityApiUrl,
      publicKey,
      contractPackageHash,
      page
    ],
    () =>
      erc20TokenActivityRequest(
        casperClarityApiUrl,
        publicKey,
        contractPackageHash,
        page
      ),
    { staleTime: ERC20_TOKEN_ACTIVITY_REFRESH_RATE }
  );

export const dispatchFetchErc20TokenActivity = (
  publicKey: string,
  contractPackageHash: string,
  page: number
): Promise<Payload<PaginatedResponse<Erc20TokenActionResult>>> =>
  dispatchToMainStore(
    serviceMessage.fetchErc20TokenActivityRequest({
      publicKey,
      contractPackageHash,
      page
    })
  );
