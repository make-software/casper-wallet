import { TimeoutDurationSetting } from '@popup/constants';
import { Keys } from 'casper-js-sdk';

export interface Account {
  name: string;
  keyPair: Keys.Ed25519 | Keys.Secp256K1;
  isBackedUp: boolean;
}

export type VaultState = {
  password: string | null;
  isLocked: boolean;
  timeoutDurationSetting: TimeoutDurationSetting;
  lastActivityTime: number | null;
  accounts: Account[];

  // TODO: move it to separated store part
  windowId: number | null;
};
