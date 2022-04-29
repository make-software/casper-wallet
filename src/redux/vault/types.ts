// TODO: Implement account type
import { Timeout } from '@src/app/types';

export interface Account {
  name: string;
  balance: number | null;
}

export type VaultState = {
  password: string | null;
  isLocked: boolean;
  timeout: Timeout;
  timeoutStartFrom: number | null;
  accounts: Account[];
};
