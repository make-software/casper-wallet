import { NetworkSetting } from '@src/constants';

import { TimeoutDurationSetting } from '@popup/constants';

export enum ThemeMode {
  SYSTEM = 'System',
  DARK = 'Dark',
  LIGHT = 'Light'
}

export interface SettingsState {
  activeTimeoutDuration: TimeoutDurationSetting;
  activeNetwork: NetworkSetting;
  isDarkMode: boolean;
  themeMode: ThemeMode;
}
