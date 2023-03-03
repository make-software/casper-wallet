import { TimeoutDurationSetting } from '@src/apps/popup/constants';
import { RootState } from 'typesafe-actions';

export const selectTimeoutDurationSetting = (
  state: RootState
): TimeoutDurationSetting => state.timeoutDurationSetting;
