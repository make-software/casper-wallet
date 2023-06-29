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
  accountHash: string,
  page: number
) =>
  fetch(getErc20AccountActivityLink(casperApiUrl, accountHash, page))
    .then(toJson)
    .catch(handleError);

export const fetchErc20AccountActivity = ({
  casperApiUrl,
  accountHash,
  page
}: {
  casperApiUrl: string;
  accountHash: string;
  page: number;
}) =>
  queryClient.fetchQuery(
    ['erc20AccountActivityRequest', casperApiUrl, accountHash, page],
    () => erc20AccountActivityRequest(casperApiUrl, accountHash, page),
    { staleTime: ERC20_ACTIVITY_REFRESH_RATE }
  );

export const dispatchFetchErc20AccountActivity = (
  accountHash: string,
  page: number
): Promise<DataWithPayload<PaginatedResponse<Erc20TokenActionResult>>> =>
  dispatchToMainStore(
    serviceMessage.fetchErc20AccountActivityRequest({ accountHash, page })
  );
