import { ActiveAccountBalance } from '@libs/services/balance-service';
import {
  Erc20TokenActionResult,
  ExtendedDeployWithId,
  TransferResultWithId
} from '@libs/services/account-activity-service';
import { ContractPackageWithBalance } from '@src/libs/services/erc20-service';
import { NFTTokenResult } from '@libs/services/nft-service';

export interface AccountInfoState {
  balance: ActiveAccountBalance;
  erc20Tokens: ContractPackageWithBalance[];
  currencyRate: number | null;
  accountCasperActivity: TransferResultWithId[];
  accountErc20TokensActivity: Record<string, AccountErc20TokenActivity> | null;
  pendingTransactions: ExtendedDeployWithId[];
  accountDeploys: ExtendedDeployWithId[] | null;
  accountNftTokens: NFTTokenResult[] | null;
  nftTokensCount: number;
  accountDeploysCount: number;
  accountCasperActivityCount: number;
  accountTrackingIdOfSentNftTokens: Record<string, string>;
}

interface AccountErc20TokenActivity {
  tokenActivityList: Erc20TokenActionResult[];
  tokenActivityCount: number;
}
