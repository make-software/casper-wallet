import { windows } from 'webextension-polyfill';

import { bringWeb3Events } from '@background/bring-web3-events';
import { MainStore } from '@background/redux/get-main-store';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import {
  selectSystemColorScheme,
  selectThemeModeSetting
} from '@background/redux/settings/selectors';
import { ThemeMode } from '@background/redux/settings/types';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { emitSdkEventToActiveTabs } from '@background/utils';

import { handleBringWeb3 } from './bringweb3';

jest.mock('webextension-polyfill', () => ({
  windows: {
    getCurrent: jest.fn(),
    create: jest.fn()
  }
}));
jest.mock('@background/redux/vault/selectors', () => ({
  selectVaultActiveAccount: jest.fn()
}));
jest.mock('@background/redux/session/selectors', () => ({
  selectVaultIsLocked: jest.fn()
}));
jest.mock('@background/redux/settings/selectors', () => ({
  selectThemeModeSetting: jest.fn(),
  selectSystemColorScheme: jest.fn()
}));
jest.mock('@background/utils', () => ({
  emitSdkEventToActiveTabs: jest.fn()
}));

const getCurrentMock = windows.getCurrent as jest.MockedFunction<
  typeof windows.getCurrent
>;
const createWindowMock = windows.create as jest.MockedFunction<
  typeof windows.create
>;
const selectActiveAccountMock = selectVaultActiveAccount as jest.MockedFunction<
  typeof selectVaultActiveAccount
>;
const selectIsLockedMock = selectVaultIsLocked as jest.MockedFunction<
  typeof selectVaultIsLocked
>;
const selectThemeModeMock = selectThemeModeSetting as jest.MockedFunction<
  typeof selectThemeModeSetting
>;
const selectSystemSchemeMock = selectSystemColorScheme as jest.MockedFunction<
  typeof selectSystemColorScheme
>;
const emitMock = emitSdkEventToActiveTabs as jest.MockedFunction<
  typeof emitSdkEventToActiveTabs
>;

const store = { getState: () => ({}) } as unknown as MainStore;

beforeEach(() => {
  jest.clearAllMocks();
});

// `getActivePublicKey` discloses the active account's public key to the
// bringweb3 integration. The vault-lock half of P0.6 is closed below: locked or
// no-active-account now yields an explicit `null` rather than a success-shaped
// `undefined`. The per-origin CONNECTION check is still missing — a separate P3
// item; when it lands, the unlocked case here must become gated too.
describe('handleBringWeb3 — getActivePublicKey', () => {
  it("returns the active account's public key when unlocked", async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectActiveAccountMock.mockReturnValue({ publicKey: 'PK-abc' } as any);

    const result = await handleBringWeb3(
      bringWeb3Events.getActivePublicKey(),
      store
    );

    expect(result).toEqual({
      handled: true,
      response: bringWeb3Events.getActivePublicKeyResponse({
        publicKey: 'PK-abc'
      })
    });
  });

  it('withholds the key while the vault is locked, without reading the vault', async () => {
    selectIsLockedMock.mockReturnValue(true);
    selectActiveAccountMock.mockReturnValue({ publicKey: 'PK-abc' } as any);

    const result = await handleBringWeb3(
      bringWeb3Events.getActivePublicKey(),
      store
    );

    expect(result).toEqual({
      handled: true,
      response: bringWeb3Events.getActivePublicKeyResponse({ publicKey: null })
    });
    expect(selectActiveAccountMock).not.toHaveBeenCalled();
  });

  it('reports null when unlocked with no active account', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectActiveAccountMock.mockReturnValue(undefined as any);

    const result = await handleBringWeb3(
      bringWeb3Events.getActivePublicKey(),
      store
    );

    expect(result).toEqual({
      handled: true,
      response: bringWeb3Events.getActivePublicKeyResponse({ publicKey: null })
    });
  });
});

// NOTE: the locked branch pins the P0.6 forced-popup primitive — any dapp can
// trigger an unsolicited extension popup with no connection check. Characterized
// here as current behavior; when P0.6 is closed these expectations must change.
describe('handleBringWeb3 — promptLoginRequest', () => {
  it('when locked → opens the bring-web3 unlock popup positioned off the current window', async () => {
    selectIsLockedMock.mockReturnValue(true);
    getCurrentMock.mockResolvedValue({
      width: 1000,
      left: 100,
      top: 50
    } as any);

    const result = await handleBringWeb3(
      bringWeb3Events.promptLoginRequest(),
      store
    );

    expect(createWindowMock).toHaveBeenCalledTimes(1);
    expect(createWindowMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'popup.html#/bring-web3-unlock',
        type: 'popup',
        width: 360,
        height: 700,
        // left = width(1000) + xOffset(100) - popupWidth(360)
        left: 740,
        top: 50,
        focused: true
      })
    );
    expect(emitMock).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('when unlocked → emits a changed-connected-account event to active tabs (no popup)', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectActiveAccountMock.mockReturnValue({
      publicKey: 'PK-1',
      hidden: false
    } as any);
    // Drive the per-tab callback: a tab without a url is skipped, a tab with a
    // url produces a changed-connected-account event.
    const perTabResults: unknown[] = [];
    emitMock.mockImplementation(async (cb: any) => {
      perTabResults.push(cb({ url: undefined }));
      perTabResults.push(cb({ url: 'https://dapp.example' }));
    });

    const result = await handleBringWeb3(
      bringWeb3Events.promptLoginRequest(),
      store
    );

    expect(createWindowMock).not.toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledTimes(1);
    // url-less tab → undefined (early return); url tab → an sdk event object
    expect(perTabResults[0]).toBeUndefined();
    expect(perTabResults[1]).toMatchObject({
      type: expect.any(String),
      payload: expect.objectContaining({ activeKey: 'PK-1' })
    });
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('when unlocked with no active account → callback still yields an event (undefined supports)', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectActiveAccountMock.mockReturnValue(undefined as any);
    let perTab: any;
    emitMock.mockImplementation(async (cb: any) => {
      perTab = cb({ url: 'https://dapp.example' });
    });

    await handleBringWeb3(bringWeb3Events.promptLoginRequest(), store);

    expect(perTab).toMatchObject({
      payload: expect.objectContaining({ activeKey: undefined })
    });
  });
});

describe('handleBringWeb3 — getTheme', () => {
  it('explicit DARK theme → dark', async () => {
    selectThemeModeMock.mockReturnValue(ThemeMode.DARK);
    selectSystemSchemeMock.mockReturnValue(null);

    const result = await handleBringWeb3(bringWeb3Events.getTheme(), store);

    expect(result).toEqual({
      handled: true,
      response: bringWeb3Events.getThemeResponse({ theme: 'dark' })
    });
  });

  it('explicit LIGHT theme → light', async () => {
    selectThemeModeMock.mockReturnValue(ThemeMode.LIGHT);
    selectSystemSchemeMock.mockReturnValue('dark');

    const result = await handleBringWeb3(bringWeb3Events.getTheme(), store);

    expect(result).toEqual({
      handled: true,
      response: bringWeb3Events.getThemeResponse({ theme: 'light' })
    });
  });

  it('SYSTEM theme with system=light → light', async () => {
    selectThemeModeMock.mockReturnValue(ThemeMode.SYSTEM);
    selectSystemSchemeMock.mockReturnValue('light');

    const result = await handleBringWeb3(bringWeb3Events.getTheme(), store);

    expect(result).toEqual({
      handled: true,
      response: bringWeb3Events.getThemeResponse({ theme: 'light' })
    });
  });

  it('SYSTEM theme with system=null → defaults to dark', async () => {
    selectThemeModeMock.mockReturnValue(ThemeMode.SYSTEM);
    selectSystemSchemeMock.mockReturnValue(null);

    const result = await handleBringWeb3(bringWeb3Events.getTheme(), store);

    expect(result).toEqual({
      handled: true,
      response: bringWeb3Events.getThemeResponse({ theme: 'dark' })
    });
  });
});

describe('handleBringWeb3 — fall-through', () => {
  it('unrecognized action → { handled: false }', async () => {
    const result = await handleBringWeb3({ type: 'UNRELATED' }, store);
    expect(result).toEqual({ handled: false });
  });
});
