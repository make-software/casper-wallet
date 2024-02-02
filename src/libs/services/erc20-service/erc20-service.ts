import { TOKENS_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { queryClient } from '@libs/services/query-client';
import { DataResponse, Payload } from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';

import { getContractPackageUrl, getErc20TokensUrl } from './constants';
import {
  ContractPackage,
  ContractPackageWithBalance,
  Erc20Token
} from './types';

export const erc20TokensRequest = (
  casperClarityApiUrl: string,
  accountHash: string,
  signal?: AbortSignal
): Promise<DataResponse<Erc20Token[]>> =>
  fetch(getErc20TokensUrl(casperClarityApiUrl, accountHash), { signal })
    .then(toJson)
    .catch(handleError);

export const fetchErc20Tokens = ({
  casperClarityApiUrl,
  accountHash
}: {
  casperClarityApiUrl: string;
  accountHash: string;
}) =>
  queryClient.fetchQuery(
    ['getErc20Tokens', accountHash, casperClarityApiUrl],
    ({ signal }) =>
      erc20TokensRequest(casperClarityApiUrl, accountHash, signal),
    { staleTime: TOKENS_REFRESH_RATE }
  );

export const contractPackageRequest = (
  casperClarityApiUrl: string,
  contractPackageHash: string,
  signal?: AbortSignal
): Promise<ContractPackage> =>
  fetch(getContractPackageUrl(casperClarityApiUrl, contractPackageHash), {
    signal
  })
    .then(toJson)
    .catch(handleError);

export const fetchContractPackage = ({
  casperClarityApiUrl,
  contractPackageHash
}: {
  casperClarityApiUrl: string;
  contractPackageHash: string;
}) =>
  queryClient.fetchQuery(
    ['contractPackageRequest', casperClarityApiUrl, contractPackageHash],
    ({ signal }) =>
      contractPackageRequest(casperClarityApiUrl, contractPackageHash, signal),
    { staleTime: TOKENS_REFRESH_RATE }
  );

export const dispatchFetchErc20TokensRequest = (
  accountHash: string
): Promise<Payload<ContractPackageWithBalance[]>> =>
  dispatchToMainStore(serviceMessage.fetchErc20TokensRequest({ accountHash }));
