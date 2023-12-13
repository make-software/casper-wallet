import { TimeoutDurationSetting } from '@popup/constants';
import { NetworkSetting } from '@src/constants';

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
