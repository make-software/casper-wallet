import { NetworkSetting } from '@src/constants';

import { TimeoutDurationSetting } from '@popup/constants';

import { RootState } from '@background/redux/store-types';

import {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged,
  casperNetworkApiVersionChanged,
  swapDeadlineSettingChanged,
  swapSlippageSettingChanged,
  systemColorSchemeChanged,
  themeModeSettingChanged,
  vaultSettingsReseted
} from './actions';
import { reducer } from './reducer';
import {
  selectSwapDeadlineSetting,
  selectSwapSlippageSetting
} from './selectors';
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

describe('swap settings', () => {
  it('defaults to the core slippage and deadline', () => {
    expect(initial.swapSlippage).toBe(3);
    expect(initial.swapDeadline).toBe(20);
  });

  it('sets an in-range slippage', () => {
    const s = reducer(undefined as any, swapSlippageSettingChanged(1.5));
    expect(s.swapSlippage).toBe(1.5);
  });

  it.each([
    [75, 50],
    [0, 0.01],
    [NaN, 0.01]
  ])('clamps slippage %p to %p', (input, expected) => {
    const s = reducer(undefined as any, swapSlippageSettingChanged(input));
    expect(s.swapSlippage).toBe(expected);
  });

  it('sets an in-range deadline', () => {
    const s = reducer(undefined as any, swapDeadlineSettingChanged(45));
    expect(s.swapDeadline).toBe(45);
  });

  it.each([
    [500, 120],
    [0, 1],
    [NaN, 1]
  ])('clamps deadline %p to %p', (input, expected) => {
    const s = reducer(undefined as any, swapDeadlineSettingChanged(input));
    expect(s.swapDeadline).toBe(expected);
  });

  it('leaves the other settings alone', () => {
    const s = reducer(
      { ...initial, activeNetwork: NetworkSetting.Testnet },
      swapSlippageSettingChanged(5)
    );
    expect(s.activeNetwork).toBe(NetworkSetting.Testnet);
    expect(s.swapSlippage).toBe(5);
  });

  it('resets both fields with the vault', () => {
    const changed = reducer(
      reducer(undefined as any, swapSlippageSettingChanged(9)),
      swapDeadlineSettingChanged(90)
    );
    const s = reducer(changed, vaultSettingsReseted());
    expect(s.swapSlippage).toBe(3);
    expect(s.swapDeadline).toBe(20);
  });

  it('falls back to the defaults for a settings shape persisted before swap existed', () => {
    const legacy = {
      settings: { activeNetwork: NetworkSetting.Mainnet }
    } as unknown as RootState;
    expect(selectSwapSlippageSetting(legacy)).toBe(3);
    expect(selectSwapDeadlineSetting(legacy)).toBe(20);
  });
});
