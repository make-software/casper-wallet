import { NetworkSetting } from '@src/constants';

import { TimeoutDurationSetting } from '@popup/constants';

import {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged,
  casperNetworkApiVersionChanged,
  systemColorSchemeChanged,
  themeModeSettingChanged,
  vaultSettingsReseted
} from './actions';
import { reducer } from './reducer';
import { ThemeMode } from './types';

const initial = reducer(undefined, { type: '@@INIT' } as any);

describe('settings reducer', () => {
  it('sets the active timeout duration', () => {
    const s = reducer(
      undefined as any,
      activeTimeoutDurationSettingChanged(TimeoutDurationSetting['1 hour'])
    );
    expect(s.activeTimeoutDuration).toBe(TimeoutDurationSetting['1 hour']);
  });
  it('sets the active network', () => {
    const s = reducer(
      undefined as any,
      activeNetworkSettingChanged(NetworkSetting.Testnet)
    );
    expect(s.activeNetwork).toBe(NetworkSetting.Testnet);
  });
  it('sets the theme mode', () => {
    const s = reducer(
      undefined as any,
      themeModeSettingChanged(ThemeMode.DARK)
    );
    expect(s.themeMode).toBe(ThemeMode.DARK);
  });
  it('sets the casper network api version', () => {
    const s = reducer(
      undefined as any,
      casperNetworkApiVersionChanged('2.0.0')
    );
    expect(s.casperNetworkApiVersion).toBe('2.0.0');
  });
  it('sets the system color scheme', () => {
    const s = reducer(undefined as any, systemColorSchemeChanged('dark'));
    expect(s.systemColorScheme).toBe('dark');
  });
  it('resets to the initial state on vaultSettingsReseted', () => {
    const changed = reducer(
      undefined as any,
      activeNetworkSettingChanged(NetworkSetting.Testnet)
    );
    const s = reducer(changed, vaultSettingsReseted());
    expect(s).toEqual(initial);
  });

  it('defaults themeMode to SYSTEM on non-Safari builds', () => {
    expect(initial.themeMode).toBe(ThemeMode.SYSTEM);
  });

  it('defaults themeMode to LIGHT on Safari builds', () => {
    jest.isolateModules(() => {
      jest.doMock('@src/utils', () => ({
        ...jest.requireActual('@src/utils'),
        isSafariBuild: true
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- require is required to re-import the module under the mocked build flag
      const { reducer: safariReducer } = require('./reducer');
      const safariInitial = safariReducer(undefined, { type: '@@INIT' } as any);
      expect(safariInitial.themeMode).toBe(ThemeMode.LIGHT);
    });
    jest.dontMock('@src/utils');
  });
});
