import { createAction } from 'typesafe-actions';

import { TimeoutDurationSetting } from '@popup/constants';
import { NetworkSetting } from '@src/constants';

export const activeTimeoutDurationSettingChanged = createAction(
  'ACTIVE_TIMEOUT_DURATION_SETTING_CHANGED'
)<TimeoutDurationSetting>();

export const activeNetworkSettingChanged = createAction(
  'ACTIVE_NETWORK_SETTING_CHANGED'
)<NetworkSetting>();

export const darkModeSettingChanged = createAction(
  'DARK_MODE_SETTING_CHANGED'
)();

export const vaultSettingsReseted = createAction('VAULT_SETTINGS_RESETED')();
