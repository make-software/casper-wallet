import { TimeoutDurationSetting } from '@popup/constants';

// Maybe make sense to move `Account` and `AccountKeyPair` to shared place, because it used by `popup` and `import-account-with-file` apps
interface AccountKeyPair {
  secretKey: string;
  publicKey: string;
}

export interface Account {
  name: string;
  keyPair: AccountKeyPair;
}

export type VaultState = {
  password: string | null;
  isLocked: boolean;
  timeoutDurationSetting: TimeoutDurationSetting;
  lastActivityTime: number | null;
  accounts: Account[];
};
