import { State } from '@src/redux/types';
import { TimeoutDurationSetting } from '@src/app/constants';

export const selectVaultDoesExist = (state: State): boolean =>
  !!state.vault.password;

export const selectVaultHasAccount = (state: State): boolean =>
  state.vault.accounts.length > 0;

export const selectVaultIsLocked = (state: State): boolean =>
  state.vault.isLocked;

export const selectVaultPassword = (state: State): string =>
  state.vault.password || '';

export const selectVaultTimeoutDurationSetting = (
  state: State
): TimeoutDurationSetting => state.vault.timeoutDurationSetting;

export const selectVaultTimeoutStartTime = (state: State): number | null =>
  state.vault.timeoutStartTime;
