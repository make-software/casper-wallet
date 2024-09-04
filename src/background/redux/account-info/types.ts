import { InfiniteData } from '@tanstack/react-query';
import { IDeploy } from 'casper-wallet-core';
import { CsprTransferDeployDto } from 'casper-wallet-core/src/data/dto';
import { CloudPaginatedResponse } from 'casper-wallet-core/src/domain/common/http/data-provider';

import { AccountBalance } from '@libs/services/balance-service';
import { ContractPackageWithBalance } from '@libs/services/erc20-service';
import { NFTTokenResult } from '@libs/services/nft-service';
import { PaginatedResponse } from '@libs/services/types';

export interface AccountInfoState {
  balance: AccountBalance;
  erc20Tokens: ContractPackageWithBalance[];
  currencyRate: number | null;
  csprTransferDeploysData: CsprTransferDeploysDataType | null;
  cep18TransferDeploysData: Record<string, Cep18TransferDeploysDataType> | null;
  pendingDeployHashes: string[];
  accountDeploysData: AccountDeploysDataType | null;
  accountNftTokens: NFTTokenResult[] | null;
  nftTokensCount: number;
  accountDeploysCount: number;
  accountCasperActivityCount: number;
  accountTrackingIdOfSentNftTokens: Record<string, string>;
}

export type CsprTransferDeploysDataType =
  | InfiniteData<PaginatedResponse<CsprTransferDeployDto>, unknown>
  | undefined;

export type Cep18TransferDeploysDataType =
  | InfiniteData<PaginatedResponse<IDeploy>, unknown>
  | undefined;

export type AccountDeploysDataType =
  | InfiniteData<CloudPaginatedResponse<IDeploy>, unknown>
  | undefined;
