import { TimeoutDurationSetting } from '@src/app/constants';

export interface Account {
  name: string;
  balance: number | null;
}

export type VaultState = {
  password: string | null;
  isLocked: boolean;
  timeoutDurationSetting: TimeoutDurationSetting;
  timeoutStartTime: number | null;
  accounts: Account[];
};
