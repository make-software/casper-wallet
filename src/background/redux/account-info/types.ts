import { ActiveAccountBalance } from '@libs/services/balance-service';
import {
  Erc20TokenActionResult,
  ExtendedDeployResultWithId,
  LedgerLiveDeploysWithId
} from '@libs/services/account-activity-service';
import { ContractPackageWithBalance } from '@src/libs/services/erc20-service';

export interface AccountInfoState {
  balance: ActiveAccountBalance;
  erc20Tokens: ContractPackageWithBalance[];
  currencyRate: number | null;
  accountActivity: LedgerLiveDeploysWithId[] | null;
  accountErc20Activity: Erc20TokenActionResult[] | null;
  pendingTransactions: ExtendedDeployResultWithId[];
}
