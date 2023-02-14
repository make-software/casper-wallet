import { TimeoutDurationSetting } from '@popup/constants';
import { SecretPhrase } from '@src/libs/crypto';

export interface KeyPair {
  secretKey: string;
  publicKey: string;
}

// Maybe make sense to move `Account` to shared place, because it used by `popup` and `import-account-with-file` apps
export interface Account extends KeyPair {
  name: string;
  imported?: boolean;
}

export interface AccountListRows extends Account {
  id: string;
}

type AccountNamesByOriginDict = Record<string, string[]>;

export type VaultState = {
  timeoutDurationSetting: TimeoutDurationSetting;
  secretPhrase: null | SecretPhrase;
  accounts: Account[];
  accountNamesByOriginDict: AccountNamesByOriginDict;
  activeAccountName: string | null;
};
