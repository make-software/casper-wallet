import { createSelector } from 'reselect';
import { State } from '@popup/redux/types';
import { TimeoutDurationSetting } from '@popup/constants';
import { Account } from '@popup/redux/vault/types';

import { encodeBase64 } from 'tweetnacl-util';

export const selectVaultDoesExist = (state: State): boolean =>
  !!state.vault.password;

export const selectVaultHasAccount = (state: State): boolean =>
  state.vault.accounts.length > 0;

export const selectVaultAccounts = (state: State): Account[] =>
  state.vault.accounts;

export const selectVaultAccountNames = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.name)
);

export const selectVaultAccountPrivateKeysBase64 = createSelector(
  selectVaultAccounts,
  accounts =>
    accounts.map(account =>
      'data' in account.keyPair.privateKey
        ? //@ts-ignore
          encodeBase64(account.keyPair.privateKey.data)
        : encodeBase64(account.keyPair.privateKey)
    )
);

export const selectVaultIsLocked = (state: State): boolean =>
  state.vault.isLocked;

export const selectVaultPassword = (state: State): string =>
  state.vault.password || '';

export const selectVaultTimeoutDurationSetting = (
  state: State
): TimeoutDurationSetting => state.vault.timeoutDurationSetting;

export const selectVaultLastActivityTime = (state: State): number | null =>
  state.vault.lastActivityTime;

// TODO: move it to separated store part
export const selectWindowId = (state: State): number | null =>
  state.vault.windowId;
