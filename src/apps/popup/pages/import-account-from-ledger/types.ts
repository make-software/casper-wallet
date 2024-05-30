import { AccountWithBalance } from '@libs/types/account';

export type ILedgerAccountListItem = Omit<
  AccountWithBalance,
  'hidden' | 'secretKey' | 'imported' | 'hardware'
> & { id: string };
