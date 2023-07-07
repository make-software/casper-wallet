import { serviceMessage } from '@background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';
import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { DataWithPayload, PaginatedResponse } from '@libs/services/types';
import { ERC20_ACTIVITY_REFRESH_RATE } from '@src/constants';

import { getErc20AccountActivityLink } from './constants';
import { Erc20TokenActionResult } from './types';

export const erc20AccountActivityRequest = (
  casperApiUrl: string,
  publicKey: string,
  page: number
): Promise<PaginatedResponse<Erc20TokenActionResult>> =>
  fetch(getErc20AccountActivityLink(casperApiUrl, publicKey, page))
    .then(toJson)
    .catch(handleError);

export const fetchErc20AccountActivity = ({
  casperApiUrl,
  publicKey,
  page
}: {
  casperApiUrl: string;
  publicKey: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    ['erc20AccountActivityRequest', casperApiUrl, publicKey, page],
    () => erc20AccountActivityRequest(casperApiUrl, publicKey, page),
    { staleTime: ERC20_ACTIVITY_REFRESH_RATE }
  );

export const dispatchFetchErc20AccountActivity = (
  publicKey: string,
  page: number
): Promise<DataWithPayload<PaginatedResponse<Erc20TokenActionResult>>> =>
  dispatchToMainStore(
    serviceMessage.fetchErc20AccountActivityRequest({ publicKey, page })
  );
