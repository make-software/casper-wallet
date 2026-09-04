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
  casperNetworkApiVersion: string;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  systemColorScheme: 'dark' | 'light' | null;
  /** Max swap slippage, in percent. Always inside [MIN_SLIPPAGE, MAX_SLIPPAGE]. */
  swapSlippage: number;
  /** Swap transaction deadline, in minutes. Always inside [MIN_DEADLINE, MAX_DEADLINE]. */
  swapDeadline: number;
}
