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
  /**
   * Max swap slippage, in percent. Always inside [MIN_SLIPPAGE, MAX_SLIPPAGE] once set.
   *
   * Optional because this slice is hydrated from `storage.local` as `preloadedState`, which
   * Redux does not merge with `initialState`: a vault written before swap existed reaches the
   * selectors without it, and the `??` in `selectSwapSlippageSetting` is what supplies a value.
   */
  swapSlippage?: number;
  /** Swap transaction deadline, in minutes. See {@link SettingsState.swapSlippage}. */
  swapDeadline?: number;
}
