import { AccountBalance } from '@libs/services/balance-service';
import { ContractPackageWithBalance } from '@libs/services/erc20-service';
import { NFTTokenResult } from '@libs/services/nft-service';

export interface AccountInfoState {
  balance: AccountBalance;
  erc20Tokens: ContractPackageWithBalance[];
  currencyRate: number | null;
  pendingDeployHashes: string[];
  accountNftTokens: NFTTokenResult[] | null;
  nftTokensCount: number;
  accountTrackingIdOfSentNftTokens: Record<string, string>;
}
