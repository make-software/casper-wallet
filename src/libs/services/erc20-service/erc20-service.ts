import { handleError, toJson } from '@libs/services/utils';
import { queryClient } from '@libs/services/query-client';
import { TOKENS_REFRESH_RATE } from '@src/constants';
import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';
import { DataResponse, DataWithPayload } from '@libs/services/types';

import {
  ContractPackage,
  ContractPackageWithBalance,
  Erc20Token
} from './types';
import { getContractPackageUrl, getErc20TokensUrl } from './constants';

export const erc20TokensRequest = (
  casperApiUrl: string,
  accountHash: string
): Promise<DataResponse<Erc20Token[]>> =>
  fetch(getErc20TokensUrl(casperApiUrl, accountHash))
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
    () => erc20TokensRequest(casperApiUrl, accountHash),
    { staleTime: TOKENS_REFRESH_RATE }
  );

export const contractPackageRequest = (
  casperApiUrl: string,
  contractPackageHash: string
): Promise<ContractPackage> =>
  fetch(getContractPackageUrl(casperApiUrl, contractPackageHash))
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
    () => contractPackageRequest(casperApiUrl, contractPackageHash),
    { staleTime: TOKENS_REFRESH_RATE }
  );

export const dispatchFetchErc20TokensRequest = (
  accountHash: string
): Promise<DataWithPayload<ContractPackageWithBalance[]>> =>
  dispatchToMainStore(serviceMessage.fetchErc20TokensRequest({ accountHash }));
