import { TimeoutDurationSetting } from '@popup/constants';
import { NetworkSetting } from '@src/constants';

export interface SettingsState {
  activeTimeoutDuration: TimeoutDurationSetting;
  activeNetwork: NetworkSetting;
}
