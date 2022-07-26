import { TimeoutDurationSetting } from '@popup/constants';

export interface AccountData {
  name: string;
  secretKey: string;
  publicKey: string;
}

// Maybe make sense to move `Account` to shared place, because it used by `popup` and `import-account-with-file` apps
export interface Account extends AccountData {
  connectedToSites: string[];
}

export type VaultState = {
  password: string | null;
  isLocked: boolean;
  timeoutDurationSetting: TimeoutDurationSetting;
  lastActivityTime: number | null;
  accounts: Account[];
  activeAccountName: string | null;
};
