import { ActiveAccountBalance } from '@libs/services/balance-service';
import {
  Erc20TokenActionResult,
  ExtendedDeployResultWithId,
  LedgerLiveDeploysWithId
} from '@libs/services/account-activity-service';

export interface AccountInfoState {
  balance: ActiveAccountBalance;
  currencyRate: number | null;
  accountActivity: LedgerLiveDeploysWithId[] | null;
  accountErc20Activity: Erc20TokenActionResult[] | null;
  pendingTransactions: ExtendedDeployResultWithId[];
}
