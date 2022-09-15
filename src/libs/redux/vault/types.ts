export enum TimeoutDurationSetting {
  '1 min' = '1 min',
  '5 min' = '5 min',
  '15 min' = '15 min',
  '30 min' = '30 min',
  '1 hour' = '1 hour',
  '24 hours' = '24 hours'
}

export interface Account {
  name: string;
  secretKey: string;
  publicKey: string;
}

type AccountNamesByOriginDict = Record<string, string[]>;

export type VaultState = {
  password: string | null;
  isLocked: boolean;
  timeoutDurationSetting: TimeoutDurationSetting;
  lastActivityTime: number | null;
  accounts: Account[];
  accountNamesByOriginDict: AccountNamesByOriginDict;
  activeAccountName: string | null;
  activeOrigin: string | null;
};
