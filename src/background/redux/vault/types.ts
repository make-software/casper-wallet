import { TimeoutDurationSetting } from '@popup/constants';

export interface KeyPair {
  secretKey: string;
  publicKey: string;
}

// Maybe make sense to move `Account` to shared place, because it used by `popup` and `import-account-with-file` apps
export interface Account extends KeyPair {
  name: string;
  imported?: boolean;
}

type AccountNamesByOriginDict = Record<string, string[]>;

export type VaultState = {
  passwordHash: string | null;
  passwordSaltHash: string | null;
  encryptSaltHash: string | null;
  secretPhraseCipher: string | null;
  isLocked: boolean;
  timeoutDurationSetting: TimeoutDurationSetting;
  lastActivityTime: number | null;
  accounts: Account[];
  accountNamesByOriginDict: AccountNamesByOriginDict;
  activeAccountName: string | null;
  activeOrigin: string | null;
};
