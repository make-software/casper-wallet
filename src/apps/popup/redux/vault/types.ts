import { TimeoutDurationSetting } from '@popup/constants';

// Maybe make sense to move `Account` to shared place, because it used by `popup` and `import-account-with-file` apps
export interface Account {
  name: string;
  secretKey: string;
  publicKey: string;
}

export interface MapAccountNamesToConnectedTabOrigins {
  [accountName: string]: string[];
}

export type VaultState = {
  password: string | null;
  isLocked: boolean;
  timeoutDurationSetting: TimeoutDurationSetting;
  lastActivityTime: number | null;
  accounts: Account[];
  activeAccountName: string | null;
  mapAccountNamesToConnectedTabOrigins: MapAccountNamesToConnectedTabOrigins;
};
