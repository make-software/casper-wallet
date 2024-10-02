import { Account } from '@libs/types/account';

export type ILedgerAccountListItem = Omit<
  Account,
  'hidden' | 'secretKey' | 'imported' | 'hardware'
> & { id: string };
