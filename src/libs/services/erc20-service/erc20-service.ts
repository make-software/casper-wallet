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
  casperApiUrl: string,
  accountHash: string,
  signal?: AbortSignal
): Promise<DataResponse<Erc20Token[]>> =>
  fetch(getErc20TokensUrl(casperApiUrl, accountHash), { signal })
    .then(toJson)
    .catch(handleError);

export const fetchErc20Tokens = ({
  casperApiUrl,
  accountHash
}: {
  casperApiUrl: string;
  accountHash: string;
}) =>
  queryClient.fetchQuery(
    ['getErc20Tokens', accountHash, casperApiUrl],
    ({ signal }) => erc20TokensRequest(casperApiUrl, accountHash, signal),
    { staleTime: TOKENS_REFRESH_RATE }
  );

export const contractPackageRequest = (
  casperApiUrl: string,
  contractPackageHash: string,
  signal?: AbortSignal
): Promise<ContractPackage> =>
  fetch(getContractPackageUrl(casperApiUrl, contractPackageHash), { signal })
    .then(toJson)
    .catch(handleError);

export const fetchContractPackage = ({
  casperApiUrl,
  contractPackageHash
}: {
  casperApiUrl: string;
  contractPackageHash: string;
}) =>
  queryClient.fetchQuery(
    ['contractPackageRequest', casperApiUrl, contractPackageHash],
    ({ signal }) =>
      contractPackageRequest(casperApiUrl, contractPackageHash, signal),
    { staleTime: TOKENS_REFRESH_RATE }
  );

export const dispatchFetchErc20TokensRequest = (
  accountHash: string
): Promise<Payload<ContractPackageWithBalance[]>> =>
  dispatchToMainStore(serviceMessage.fetchErc20TokensRequest({ accountHash }));
