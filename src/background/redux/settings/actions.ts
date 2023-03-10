import { createAction } from 'typesafe-actions';

import {
  Network,
  TimeoutDurationSetting
} from '@background/redux/settings/types';

export const activeTimeoutDurationSettingChanged = createAction(
  'ACTIVE_TIMEOUT_DURATION_SETTING_CHANGED'
)<TimeoutDurationSetting>();

export const activeNetworkSettingChanged = createAction(
  'ACTIVE_NETWORK_SETTING_CHANGED'
)<Network>();
