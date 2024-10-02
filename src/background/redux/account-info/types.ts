import { ContractPackageWithBalance } from '@libs/services/erc20-service';
import { NFTTokenResult } from '@libs/services/nft-service';

export interface AccountInfoState {
  erc20Tokens: ContractPackageWithBalance[];
  pendingDeployHashes: string[];
  accountNftTokens: NFTTokenResult[] | null;
  nftTokensCount: number;
  accountTrackingIdOfSentNftTokens: Record<string, string>;
}
