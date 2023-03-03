import { TimeoutDurationSetting } from '@src/apps/popup/constants';
import { createAction } from 'typesafe-actions';

export const timeoutDurationSettingChanged = createAction(
  'TIMEOUT_DURATION_SETTING_CHANGED'
)<TimeoutDurationSetting>();
