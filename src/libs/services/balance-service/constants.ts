import { ICsprBalance } from 'casper-wallet-core/src/domain/tokens';

type AccountsBalances = Record<string, ICsprBalance> | undefined;

export interface UseFetchAccountsBalances {
  accountsBalances: AccountsBalances;
  isLoadingBalances: boolean;
}
