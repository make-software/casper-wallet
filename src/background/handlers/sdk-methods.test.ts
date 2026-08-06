import { PublicKey } from 'casper-js-sdk';
import { Runtime, runtime } from 'webextension-polyfill';

import {
  getActiveAccountSupports,
  getUrlOrigin,
  isEqualCaseInsensitive
} from '@src/utils';

import { WindowApp } from '@background/create-open-window';
import { openWindow } from '@background/open-window';
import { MainStore } from '@background/redux/get-main-store';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import {
  selectAccountNamesByOriginDict,
  selectIsAccountConnected,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';
import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { sdkMethod } from '@content/sdk-method';

import { encryptAsHexWithCasperPublicKey } from '@libs/crypto';

import { handleSdkMethod } from './sdk-methods';

// Heavy / side-effecting dependencies are stubbed so we test PURE routing:
// which window opens, which action dispatches, which response shape returns.
jest.mock('webextension-polyfill', () => ({
  runtime: { getManifest: jest.fn() }
}));
jest.mock('casper-js-sdk', () => ({
  // Deploy is used only as a type; PublicKey.fromHex is a runtime validator.
  PublicKey: { fromHex: jest.fn() }
}));
jest.mock('@background/open-window', () => ({ openWindow: jest.fn() }));
jest.mock('@background/utils', () => ({
  emitSdkEventToActiveTabsWithOrigin: jest.fn()
}));
jest.mock('@libs/crypto', () => ({
  encryptAsHexWithCasperPublicKey: jest.fn()
}));
jest.mock('@src/utils', () => ({
  getUrlOrigin: jest.fn(),
  getActiveAccountSupports: jest.fn(),
  isEqualCaseInsensitive: jest.fn()
}));
jest.mock('@background/redux/vault/selectors', () => ({
  selectVaultActiveAccount: jest.fn(),
  selectIsAccountConnected: jest.fn(),
  selectAccountNamesByOriginDict: jest.fn()
}));
jest.mock('@background/redux/session/selectors', () => ({
  selectVaultIsLocked: jest.fn()
}));

const getManifestMock = runtime.getManifest as jest.MockedFunction<
  typeof runtime.getManifest
>;
const fromHexMock = PublicKey.fromHex as jest.MockedFunction<
  typeof PublicKey.fromHex
>;
const openWindowMock = openWindow as jest.MockedFunction<typeof openWindow>;
const emitMock = emitSdkEventToActiveTabsWithOrigin as jest.MockedFunction<
  typeof emitSdkEventToActiveTabsWithOrigin
>;
const encryptMock = encryptAsHexWithCasperPublicKey as jest.MockedFunction<
  typeof encryptAsHexWithCasperPublicKey
>;
const getUrlOriginMock = getUrlOrigin as jest.MockedFunction<
  typeof getUrlOrigin
>;
const getSupportsMock = getActiveAccountSupports as jest.MockedFunction<
  typeof getActiveAccountSupports
>;
const isEqualCIMock = isEqualCaseInsensitive as jest.MockedFunction<
  typeof isEqualCaseInsensitive
>;
const selectActiveAccountMock = selectVaultActiveAccount as jest.MockedFunction<
  typeof selectVaultActiveAccount
>;
const selectIsConnectedMock = selectIsAccountConnected as jest.MockedFunction<
  typeof selectIsAccountConnected
>;
const selectNamesByOriginMock =
  selectAccountNamesByOriginDict as jest.MockedFunction<
    typeof selectAccountNamesByOriginDict
  >;
const selectIsLockedMock = selectVaultIsLocked as jest.MockedFunction<
  typeof selectVaultIsLocked
>;

const ORIGIN = 'https://dapp.example';
const META = { requestId: 'req-1' };

function makeStore(requests: Record<string, unknown> = {}) {
  const dispatch = jest.fn();
  const store = {
    dispatch,
    getState: () => ({
      windowManagement: { windowId: null, exportKeysWindowId: null, requests }
    })
  } as unknown as MainStore;
  return { store, dispatch };
}

const SENDER = {
  url: 'https://dapp.example/page',
  tab: { id: 9 }
} as Runtime.MessageSender;

beforeEach(() => {
  jest.clearAllMocks();
  getUrlOriginMock.mockReturnValue(ORIGIN);
  selectActiveAccountMock.mockReturnValue({
    name: 'Account 1',
    publicKey: 'PK-1'
  } as any);
  selectIsConnectedMock.mockReturnValue(false);
});

describe('a requestId the wallet already registered', () => {
  // `requestId` is page-generated, i.e. dapp-controlled. The reducer already
  // refuses to overwrite a live request or resurrect a tombstone — but the six
  // method branches called `openWindow` regardless, so the wallet still opened
  // a fully functional approval screen for a request it could never answer:
  // the user's approval was then dropped by the dedup, silently. Answer the
  // dapp now instead.
  it('a replayed finished requestId is refused before anything is dispatched', async () => {
    const { store, dispatch } = makeStore({ 'req-1': { status: 'responded' } });

    await expect(
      handleSdkMethod(
        sdkMethod.connectRequest({ title: 't' }, META),
        SENDER,
        store
      )
    ).rejects.toThrow('Duplicate requestId');

    expect(openWindowMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('a live requestId reused under a different method is refused too', async () => {
    // Otherwise the first descriptor is kept and a later cancel is built in the
    // wrong shape — e.g. connectResponse(false) delivered against a pending sign.
    const { store, dispatch } = makeStore({
      'req-1': {
        status: 'open',
        tabId: 3,
        origin: ORIGIN,
        method: 'connect',
        windowIds: [7]
      }
    });

    await expect(
      handleSdkMethod(
        sdkMethod.signRequest(
          { deployJson: '{"deploy":{}}', signingPublicKeyHex: 'PK-1' },
          META
        ),
        SENDER,
        store
      )
    ).rejects.toThrow('Duplicate requestId');

    // Nothing was dispatched — in particular not `deployPayloadReceived`, which
    // is what made the replayed screen render normally.
    expect(dispatch).not.toHaveBeenCalled();
    expect(openWindowMock).not.toHaveBeenCalled();
  });
});

describe('a requestId that is not storable', () => {
  it('is refused before a window opens, instead of stranding one', async () => {
    // `__proto__` cannot be a key in the requests map, so the reducer refuses
    // it. Without this the caller was told the id was fresh, the window opened,
    // and the approval sat outside the lifecycle model entirely — not
    // cancellable on close or supersede, not deduped, not recoverable.
    const { store, dispatch } = makeStore();

    await expect(
      handleSdkMethod(
        sdkMethod.connectRequest({ title: 't' }, { requestId: '__proto__' }),
        SENDER,
        store
      )
    ).rejects.toThrow('Invalid requestId');

    expect(openWindowMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('lets the other Object.prototype names through', async () => {
    // They store as ordinary own properties; only `__proto__` does not.
    const { store } = makeStore();

    await handleSdkMethod(
      sdkMethod.connectRequest({ title: 't' }, { requestId: 'toString' }),
      SENDER,
      store
    );

    expect(openWindowMock).toHaveBeenCalledTimes(1);
  });
});

describe('connectRequest', () => {
  it('missing origin → throws CannotGetSenderOriginError', async () => {
    getUrlOriginMock.mockReturnValue(undefined);
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.connectRequest({ title: 't' }, META),
        SENDER,
        store
      )
    ).rejects.toThrow('Cannot get sender origin.');
  });

  it('missing sender tab id → throws', async () => {
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.connectRequest({ title: 't' }, META),
        {
          url: SENDER.url
        } as Runtime.MessageSender,
        store
      )
    ).rejects.toThrow('Missing sender tab id');
  });

  it('already connected → returns connectResponse(true), no window opened', async () => {
    selectIsConnectedMock.mockReturnValue(true);
    const { store, dispatch } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.connectRequest({ title: 't' }, META),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.connectResponse(true, META)
    });
    expect(openWindowMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('not connected → dispatches windowRequestOpened + opens ConnectToApp window (with title)', async () => {
    selectIsConnectedMock.mockReturnValue(false);
    const { store, dispatch } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.connectRequest({ title: 'My Dapp' }, META),
      SENDER,
      store
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          origin: ORIGIN,
          method: 'connect'
        }
      })
    );
    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({
        windowApp: WindowApp.ConnectToApp,
        searchParams: expect.objectContaining({
          requestId: 'req-1',
          origin: ORIGIN,
          tabId: '9',
          title: 'My Dapp'
        })
      })
    );
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('passes the requestId to openWindow so the window can be attached', async () => {
    selectIsConnectedMock.mockReturnValue(false);
    const { store } = makeStore();

    await handleSdkMethod(
      sdkMethod.connectRequest({ title: 't' }, META),
      SENDER,
      store
    );

    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ requestId: 'req-1' })
    );
  });
});

describe('switchAccountRequest', () => {
  it('missing origin → throws', async () => {
    getUrlOriginMock.mockReturnValue(undefined);
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.switchAccountRequest({ title: 't' }, META),
        SENDER,
        store
      )
    ).rejects.toThrow('Cannot get sender origin.');
  });

  it('opens SwitchAccount window and dispatches windowRequestOpened', async () => {
    const { store, dispatch } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.switchAccountRequest({ title: 't' }, META),
      SENDER,
      store
    );
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          origin: ORIGIN,
          method: 'switchAccount'
        }
      })
    );
    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ windowApp: WindowApp.SwitchAccount })
    );
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('passes the requestId to openWindow so the window can be attached', async () => {
    const { store } = makeStore();

    await handleSdkMethod(
      sdkMethod.switchAccountRequest({ title: 't' }, META),
      SENDER,
      store
    );

    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ requestId: 'req-1' })
    );
  });
});

describe('signRequest', () => {
  const deployJson = JSON.stringify({
    deploy: { approvals: [{ signer: 'PK-OTHER' }] }
  });

  it('unparseable deployJson → throws parse error', async () => {
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.signRequest(
          { deployJson: '{not json', signingPublicKeyHex: 'PK-1' },
          META
        ),
        SENDER,
        store
      )
    ).rejects.toThrow('Desploy json string parse error');
  });

  it('deploy already signed by this account → returns cancelled response, no window', async () => {
    isEqualCIMock.mockReturnValue(true);
    const { store, dispatch } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.signRequest(
        { deployJson, signingPublicKeyHex: 'PK-OTHER' },
        META
      ),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.signResponse(
        {
          cancelled: true,
          message: 'This deploy already sign by this account'
        },
        { requestId: 'req-1' }
      )
    });
    expect(openWindowMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('fresh deploy → dispatches deployPayloadReceived + windowRequestOpened, opens deploy window', async () => {
    isEqualCIMock.mockReturnValue(false);
    const { store, dispatch } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.signRequest({ deployJson, signingPublicKeyHex: 'PK-1' }, META),
      SENDER,
      store
    );

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          origin: ORIGIN,
          method: 'sign'
        }
      })
    );
    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({
        windowApp: WindowApp.SignatureRequestDeploy,
        searchParams: expect.objectContaining({ signingPublicKeyHex: 'PK-1' })
      })
    );
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('passes the requestId to openWindow so the window can be attached', async () => {
    isEqualCIMock.mockReturnValue(false);
    const { store } = makeStore();

    await handleSdkMethod(
      sdkMethod.signRequest({ deployJson, signingPublicKeyHex: 'PK-1' }, META),
      SENDER,
      store
    );

    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ requestId: 'req-1' })
    );
  });
});

describe('signMessageRequest', () => {
  it('opens the message-signing window', async () => {
    const { store, dispatch } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.signMessageRequest(
        { message: 'hi', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER,
      store
    );
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          origin: ORIGIN,
          method: 'signMessage'
        }
      })
    );
    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ windowApp: WindowApp.SignatureRequestMessage })
    );
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('passes the requestId to openWindow so the window can be attached', async () => {
    const { store } = makeStore();

    await handleSdkMethod(
      sdkMethod.signMessageRequest(
        { message: 'hi', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER,
      store
    );

    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ requestId: 'req-1' })
    );
  });
});

describe('signTypedDataRequest', () => {
  it('dispatches eip712PayloadReceived + opens the eip712 window', async () => {
    const { store, dispatch } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.signTypedDataRequest(
        {
          typedData: { foo: 'bar' } as any,
          options: undefined,
          signingPublicKeyHex: 'PK-1'
        },
        META
      ),
      SENDER,
      store
    );
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          origin: ORIGIN,
          method: 'signTypedData'
        }
      })
    );
    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ windowApp: WindowApp.SignatureRequestEip712 })
    );
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('passes the requestId to openWindow so the window can be attached', async () => {
    const { store } = makeStore();

    await handleSdkMethod(
      sdkMethod.signTypedDataRequest(
        {
          typedData: { foo: 'bar' } as any,
          options: undefined,
          signingPublicKeyHex: 'PK-1'
        },
        META
      ),
      SENDER,
      store
    );

    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ requestId: 'req-1' })
    );
  });
});

describe('decryptMessageRequest', () => {
  it('opens the decrypt window', async () => {
    const { store, dispatch } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.decryptMessageRequest(
        { message: 'enc', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER,
      store
    );
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          origin: ORIGIN,
          method: 'decryptMessage'
        }
      })
    );
    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ windowApp: WindowApp.DecryptMessageRequest })
    );
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('passes the requestId to openWindow so the window can be attached', async () => {
    const { store } = makeStore();

    await handleSdkMethod(
      sdkMethod.decryptMessageRequest(
        { message: 'enc', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER,
      store
    );

    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ requestId: 'req-1' })
    );
  });
});

describe('disconnectRequest', () => {
  it('no active account → throws CannotGetActiveAccountError', async () => {
    selectActiveAccountMock.mockReturnValue(undefined as any);
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.disconnectRequest(undefined, META),
        SENDER,
        store
      )
    ).rejects.toThrow('Cannot get active account.');
  });

  it('connected + unlocked → emits disconnected event, dispatches siteDisconnected, responds success', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectIsConnectedMock.mockReturnValue(true);
    getSupportsMock.mockReturnValue(['SendTransaction'] as any);
    const { store, dispatch } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.disconnectRequest(undefined, META),
      SENDER,
      store
    );

    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      handled: true,
      response: sdkMethod.disconnectResponse(true, META)
    });
  });

  it('locked → emits event with isLocked true (activeKey undefined)', async () => {
    selectIsLockedMock.mockReturnValue(true);
    selectIsConnectedMock.mockReturnValue(true);
    const { store } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.disconnectRequest(undefined, META),
      SENDER,
      store
    );

    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      handled: true,
      response: sdkMethod.disconnectResponse(true, META)
    });
  });
});

describe('isConnectedRequest', () => {
  it('locked → returns isConnectedError(WalletLocked)', async () => {
    selectIsLockedMock.mockReturnValue(true);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.isConnectedRequest(undefined, META),
      SENDER,
      store
    );
    expect((result as any).response.error).toBe(true);
    expect((result as any).response.type).toContain('IsConnected:Error');
  });

  it('unlocked + origin present in dict → connected true', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectNamesByOriginMock.mockReturnValue({ [ORIGIN]: ['Account 1'] } as any);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.isConnectedRequest(undefined, META),
      SENDER,
      store
    );
    expect(result).toEqual({
      handled: true,
      response: sdkMethod.isConnectedResponse(true, META)
    });
  });

  it('unlocked + origin absent → connected false', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectNamesByOriginMock.mockReturnValue({} as any);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.isConnectedRequest(undefined, META),
      SENDER,
      store
    );
    expect(result).toEqual({
      handled: true,
      response: sdkMethod.isConnectedResponse(false, META)
    });
  });
});

describe('getActivePublicKeyRequest', () => {
  it('locked → WalletLocked error', async () => {
    selectIsLockedMock.mockReturnValue(true);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.getActivePublicKeyRequest(undefined, META),
      SENDER,
      store
    );
    expect((result as any).response.error).toBe(true);
  });

  it('unlocked but no active account → throws', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectActiveAccountMock.mockReturnValue(undefined as any);
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.getActivePublicKeyRequest(undefined, META),
        SENDER,
        store
      )
    ).rejects.toThrow('Cannot get active account.');
  });

  it('unlocked + not connected → SiteNotConnected error', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectIsConnectedMock.mockReturnValue(false);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.getActivePublicKeyRequest(undefined, META),
      SENDER,
      store
    );
    expect((result as any).response.error).toBe(true);
  });

  it('unlocked + connected → returns the active public key', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectIsConnectedMock.mockReturnValue(true);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.getActivePublicKeyRequest(undefined, META),
      SENDER,
      store
    );
    expect(result).toEqual({
      handled: true,
      response: sdkMethod.getActivePublicKeyResponse('PK-1', META)
    });
  });
});

describe('encryptMessageRequest', () => {
  it('missing origin → throws', async () => {
    getUrlOriginMock.mockReturnValue(undefined);
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.encryptMessageRequest(
          { message: 'x', signingPublicKeyHex: 'PK-1' },
          META
        ),
        SENDER,
        store
      )
    ).rejects.toThrow('Cannot get sender origin.');
  });

  it('invalid public key hex → throws', async () => {
    fromHexMock.mockImplementation(() => {
      throw new Error('bad');
    });
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.encryptMessageRequest(
          { message: 'x', signingPublicKeyHex: 'bad' },
          META
        ),
        SENDER,
        store
      )
    ).rejects.toThrow('Public key hex is not valid');
  });

  it('message over max length → throws', async () => {
    fromHexMock.mockReturnValue({} as any);
    const { store } = makeStore();
    const longMessage = 'a'.repeat(4097);
    await expect(
      handleSdkMethod(
        sdkMethod.encryptMessageRequest(
          { message: longMessage, signingPublicKeyHex: 'PK-1' },
          META
        ),
        SENDER,
        store
      )
    ).rejects.toThrow('Message should be less than');
  });

  it('encryption failure → throws generic error', async () => {
    fromHexMock.mockReturnValue({} as any);
    encryptMock.mockRejectedValue(new Error('boom'));
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.encryptMessageRequest(
          { message: 'x', signingPublicKeyHex: 'PK-1' },
          META
        ),
        SENDER,
        store
      )
    ).rejects.toThrow('Error during message encryption');
  });

  it('success → returns encryptMessageResponse with the ciphertext', async () => {
    fromHexMock.mockReturnValue({} as any);
    encryptMock.mockResolvedValue('DEADBEEF');
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.encryptMessageRequest(
        { message: 'x', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER,
      store
    );
    expect(result).toEqual({
      handled: true,
      response: sdkMethod.encryptMessageResponse(
        { encryptedMessage: 'DEADBEEF' },
        META
      )
    });
  });
});

describe('getActivePublicKeySupportsRequest', () => {
  it('locked → error', async () => {
    selectIsLockedMock.mockReturnValue(true);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.getActivePublicKeySupportsRequest(undefined, META),
      SENDER,
      store
    );
    expect((result as any).response.error).toBe(true);
  });

  it('no active account → throws', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectActiveAccountMock.mockReturnValue(undefined as any);
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.getActivePublicKeySupportsRequest(undefined, META),
        SENDER,
        store
      )
    ).rejects.toThrow('Cannot get active account.');
  });

  it('not connected → SiteNotConnected error', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectIsConnectedMock.mockReturnValue(false);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.getActivePublicKeySupportsRequest(undefined, META),
      SENDER,
      store
    );
    expect((result as any).response.error).toBe(true);
  });

  it('connected → returns supports list', async () => {
    selectIsLockedMock.mockReturnValue(false);
    selectIsConnectedMock.mockReturnValue(true);
    getSupportsMock.mockReturnValue(['SendTransaction'] as any);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.getActivePublicKeySupportsRequest(undefined, META),
      SENDER,
      store
    );
    expect(result).toEqual({
      handled: true,
      response: sdkMethod.getActivePublicKeySupportsResponse(
        ['SendTransaction'] as any,
        META
      )
    });
  });

  it('missing origin → throws', async () => {
    getUrlOriginMock.mockReturnValue(undefined);
    const { store } = makeStore();
    await expect(
      handleSdkMethod(
        sdkMethod.getActivePublicKeySupportsRequest(undefined, META),
        SENDER,
        store
      )
    ).rejects.toThrow('Cannot get sender origin.');
  });
});

describe('getVersionRequest', () => {
  it('returns the manifest version', async () => {
    getManifestMock.mockReturnValue({ version: '9.9.9' } as any);
    const { store } = makeStore();
    const result = await handleSdkMethod(
      sdkMethod.getVersionRequest(undefined, META),
      SENDER,
      store
    );
    expect(result).toEqual({
      handled: true,
      response: sdkMethod.getVersionResponse('9.9.9', META)
    });
  });
});

describe('fall-through', () => {
  it('unrecognized action → { handled: false }', async () => {
    const { store } = makeStore();
    const result = await handleSdkMethod(
      { type: 'NOT_AN_SDK_METHOD', meta: META } as any,
      SENDER,
      store
    );
    expect(result).toEqual({ handled: false });
  });
});
