import { ActiveAccountBalance } from '@libs/services/balance-service';
import {
  ExtendedDeployResultWithId,
  LedgerLiveDeploysWithId
} from '@libs/services/account-activity-service';

export interface AccountInfoState {
  balance: ActiveAccountBalance;
  currencyRate: number | null;
  accountActivity: LedgerLiveDeploysWithId[] | null;
  pendingTransactions: ExtendedDeployResultWithId[];
}