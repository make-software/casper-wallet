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
  deployPayloadReceived,
  eip712PayloadReceived
} from '@background/redux/vault/actions';
import {
  selectAccountNamesByOriginDict,
  selectDeploysJsonById,
  selectEip712JsonById,
  selectIsAccountConnected,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';
import {
  windowRequestOpened,
  windowRequestResponded
} from '@background/redux/windowManagement/actions';
import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { sdkMethod } from '@content/sdk-method';
import { SdkErrorCode } from '@content/sdk-types';

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
  selectAccountNamesByOriginDict: jest.fn(),
  selectDeploysJsonById: jest.fn(),
  selectEip712JsonById: jest.fn()
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
const selectDeploysJsonByIdMock = selectDeploysJsonById as jest.MockedFunction<
  typeof selectDeploysJsonById
>;
const selectEip712JsonByIdMock = selectEip712JsonById as jest.MockedFunction<
  typeof selectEip712JsonById
>;

const ORIGIN = 'https://dapp.example';
const META = { requestId: 'req-1' };

// `dispatch` records a `windowRequestOpened` into a mutable backing map, mimicking
// the real reducer's accept path closely enough that the handler's post-dispatch
// re-read (`selectRequestStatus`) sees the row. A test asserting the open-request
// cap overrides `dispatch` to a no-op instead, standing in for the reducer's
// refusal — the row then never appears, exactly like the real cap.
function makeStore(requests: Record<string, unknown> = {}) {
  const state = { ...requests };
  const dispatch = jest.fn((action: { type: string; payload?: unknown }) => {
    if (action.type === windowRequestOpened.type) {
      const { requestId } = action.payload as { requestId: string };
      state[requestId] = { status: 'open' };
    }
  });
  const store = {
    dispatch,
    getState: () => ({
      windowManagement: {
        windowId: null,
        exportKeysWindowId: null,
        requests: state
      }
    })
  } as unknown as MainStore;
  return { store, dispatch };
}

const SENDER = {
  url: 'https://dapp.example/page',
  tab: { id: 9 },
  frameId: 3
} as Runtime.MessageSender;

// Top-frame sender — the common case, and the one `sender.frameId || undefined`
// would silently erase (0 is falsy). SENDER above pins only frameId 3 in every
// assertion, so that slip would keep the suite green without this variant.
const SENDER_TOP_FRAME = {
  url: 'https://dapp.example/page',
  tab: { id: 9 },
  frameId: 0
} as Runtime.MessageSender;

// `reconcileStalePayloadsSaga` may resume at any `await`, and a payload that no
// descriptor and no window claims is exactly what it purges — so the payload
// write and `windowRequestOpened` have to land in one synchronous block. The
// probe is a microtask queued at the write: an `await` in between would let it
// run before the descriptor.
function watchGapBeforeDescriptor(dispatch: jest.Mock, payloadType: string) {
  const seen: { microtaskRanBeforeDescriptor: boolean | null } = {
    microtaskRanBeforeDescriptor: null
  };
  let microtaskRan = false;

  dispatch.mockImplementation((action: { type: string }) => {
    if (action.type === payloadType) {
      void Promise.resolve().then(() => {
        microtaskRan = true;
      });
    }
    if (action.type === windowRequestOpened.type) {
      seen.microtaskRanBeforeDescriptor = microtaskRan;
    }
  });

  return seen;
}

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  getUrlOriginMock.mockReturnValue(ORIGIN);
  selectActiveAccountMock.mockReturnValue({
    name: 'Account 1',
    publicKey: 'PK-1'
  } as any);
  selectIsConnectedMock.mockReturnValue(false);
  // `dispatch` is a spy, so the store never really changes: the default stands
  // for a payload write that was accepted.
  selectDeploysJsonByIdMock.mockReturnValue({ [META.requestId]: '{}' });
  selectEip712JsonByIdMock.mockReturnValue({ [META.requestId]: '{}' });
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
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

  it('refuses an oversized requestId before anything registers', async () => {
    // Unbounded, a multi-MB dapp-supplied id could register here and later
    // overflow the `storage.session` mirror's write quota (session-store.ts).
    const { store, dispatch } = makeStore();
    const oversizedRequestId = 'x'.repeat(257);

    await expect(
      handleSdkMethod(
        sdkMethod.connectRequest(
          { title: 't' },
          { requestId: oversizedRequestId }
        ),
        SENDER,
        store
      )
    ).rejects.toThrow('Invalid requestId');

    expect(openWindowMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
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
          frameId: 3,
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

  it('a top-frame sender (frameId 0) reaches the dispatch as frameId 0', async () => {
    selectIsConnectedMock.mockReturnValue(false);
    const { store, dispatch } = makeStore();

    await handleSdkMethod(
      sdkMethod.connectRequest({ title: 't' }, META),
      SENDER_TOP_FRAME,
      store
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          frameId: 0,
          origin: ORIGIN,
          method: 'connect'
        }
      })
    );
  });

  it('refused at the open-request cap → connectResponse(false), no window', async () => {
    selectIsConnectedMock.mockReturnValue(false);
    const { store, dispatch } = makeStore();
    // Stand in for the reducer's cap refusal: the descriptor never lands.
    dispatch.mockImplementation(() => {});

    const result = await handleSdkMethod(
      sdkMethod.connectRequest({ title: 't' }, META),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.connectResponse(false, META)
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: windowRequestOpened.type })
    );
    expect(openWindowMock).not.toHaveBeenCalled();
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
          frameId: 3,
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

  it('a top-frame sender (frameId 0) reaches the dispatch as frameId 0', async () => {
    const { store, dispatch } = makeStore();

    await handleSdkMethod(
      sdkMethod.switchAccountRequest({ title: 't' }, META),
      SENDER_TOP_FRAME,
      store
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          frameId: 0,
          origin: ORIGIN,
          method: 'switchAccount'
        }
      })
    );
  });

  it('refused at the open-request cap → switchAccountResponse(false), no window', async () => {
    const { store, dispatch } = makeStore();
    dispatch.mockImplementation(() => {});

    const result = await handleSdkMethod(
      sdkMethod.switchAccountRequest({ title: 't' }, META),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.switchAccountResponse(false, META)
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: windowRequestOpened.type })
    );
    expect(openWindowMock).not.toHaveBeenCalled();
  });
});

describe('signRequest', () => {
  const deployJson = JSON.stringify({
    deploy: { approvals: [{ signer: 'PK-OTHER' }] }
  });

  it('unparseable deployJson → throws parse error and logs the cause', async () => {
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
    ).rejects.toThrow('Deploy json string parse error');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('deploy json string parse failed'),
      expect.anything()
    );
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
    // A different condition from a capacity refusal, and it must stay
    // distinguishable: this one is about the deploy, not about the wallet.
    const refused = result as {
      response: { payload: { errorCode?: string } };
    };
    expect(refused.response.payload.errorCode).toBeUndefined();
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
          frameId: 3,
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

  it('a top-frame sender (frameId 0) reaches the dispatch as frameId 0', async () => {
    // jest's argument equality ignores an `undefined` value but not a `0`, so
    // `frameId: 0` here is what discriminates against `sender.frameId ||
    // undefined`.
    isEqualCIMock.mockReturnValue(false);
    const { store, dispatch } = makeStore();

    await handleSdkMethod(
      sdkMethod.signRequest({ deployJson, signingPublicKeyHex: 'PK-1' }, META),
      SENDER_TOP_FRAME,
      store
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          frameId: 0,
          origin: ORIGIN,
          method: 'sign'
        }
      })
    );
  });

  it('dispatches the deploy payload and the descriptor in one synchronous block', async () => {
    isEqualCIMock.mockReturnValue(false);
    const { store, dispatch } = makeStore();
    const seen = watchGapBeforeDescriptor(dispatch, deployPayloadReceived.type);

    await handleSdkMethod(
      sdkMethod.signRequest({ deployJson, signingPublicKeyHex: 'PK-1' }, META),
      SENDER,
      store
    );

    // `null` would mean no descriptor was dispatched at all.
    expect(seen.microtaskRanBeforeDescriptor).toBe(false);
  });

  it('payload write refused at capacity → cancelled response, no window', async () => {
    // The map stays empty after the dispatch, so the signature page would have
    // had nothing to render and the dapp promise would have hung to its own
    // 30-minute timeout.
    isEqualCIMock.mockReturnValue(false);
    selectDeploysJsonByIdMock.mockReturnValue({});
    const { store, dispatch } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.signRequest({ deployJson, signingPublicKeyHex: 'PK-1' }, META),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.signResponse(
        {
          cancelled: true,
          message: 'Too many pending signature requests',
          errorCode: SdkErrorCode.tooManyPendingRequests
        },
        { requestId: 'req-1' }
      )
    });
    // Only the payload dispatch — no `windowRequestOpened` descriptor.
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  it('a capacity refusal is surfaced in the extension log, identifiers only', async () => {
    isEqualCIMock.mockReturnValue(false);
    selectDeploysJsonByIdMock.mockReturnValue({});
    const { store } = makeStore();

    await handleSdkMethod(
      sdkMethod.signRequest({ deployJson, signingPublicKeyHex: 'PK-1' }, META),
      SENDER,
      store
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), {
      requestId: 'req-1',
      method: sdkMethod.signRequest.type
    });
    const logged = JSON.stringify(consoleErrorSpy.mock.calls);
    expect(logged).not.toContain('PK-1');
    expect(logged).not.toContain(ORIGIN);
  });

  it('a prototype-name requestId reads as absent, not as an inherited member', async () => {
    // A bare `map[requestId]` would answer with the `Object` constructor here
    // and conclude the refused write had succeeded.
    isEqualCIMock.mockReturnValue(false);
    selectDeploysJsonByIdMock.mockReturnValue({});
    const { store, dispatch } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.signRequest(
        { deployJson, signingPublicKeyHex: 'PK-1' },
        { requestId: 'constructor' }
      ),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.signResponse(
        {
          cancelled: true,
          message: 'Too many pending signature requests',
          errorCode: SdkErrorCode.tooManyPendingRequests
        },
        { requestId: 'constructor' }
      )
    });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  it('a falsy stored payload counts as present', async () => {
    // `JSON.parse('0')` is what lands in the map, so presence must be a
    // null check — a truthiness test would refuse an accepted write.
    isEqualCIMock.mockReturnValue(false);
    selectDeploysJsonByIdMock.mockReturnValue({ [META.requestId]: 0 } as any);
    const { store, dispatch } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.signRequest(
        { deployJson: '0', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER,
      store
    );

    expect(result).toEqual({ handled: true, response: undefined });
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ windowApp: WindowApp.SignatureRequestDeploy })
    );
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

  it('refused at the open-request cap → the payload-cap-style cancelled response, no window', async () => {
    // Payload cap has room (default mock), only the open-request cap refuses —
    // so, unlike the payload-cap refusal above, the payload dispatch DOES land
    // and only the descriptor dispatch is refused: the accepted deploy payload
    // is left stranded for `reconcileStalePayloadsSaga` to reclaim.
    isEqualCIMock.mockReturnValue(false);
    const { store, dispatch } = makeStore();
    dispatch.mockImplementation(() => {});

    const result = await handleSdkMethod(
      sdkMethod.signRequest({ deployJson, signingPublicKeyHex: 'PK-1' }, META),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.signResponse(
        {
          cancelled: true,
          message: 'Too many pending signature requests',
          errorCode: SdkErrorCode.tooManyPendingRequests
        },
        { requestId: 'req-1' }
      )
    });
    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: windowRequestOpened.type })
    );
    // Reclaims the stranded payload immediately, rather than waiting on
    // `reconcileStalePayloadsSaga`: the vault reducer deletes the payload
    // keyed off exactly this action.
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: windowRequestResponded.type,
        payload: { requestId: 'req-1' }
      })
    );
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  it('an open-request-cap refusal is logged, distinct from the payload-cap message, identifiers only', async () => {
    isEqualCIMock.mockReturnValue(false);
    const { store, dispatch } = makeStore();
    dispatch.mockImplementation(() => {});

    await handleSdkMethod(
      sdkMethod.signRequest({ deployJson, signingPublicKeyHex: 'PK-1' }, META),
      SENDER,
      store
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('open-request map at capacity'),
      {
        requestId: 'req-1',
        method: sdkMethod.signRequest.type,
        openCount: 0
      }
    );
    const logged = JSON.stringify(consoleErrorSpy.mock.calls);
    expect(logged).not.toContain('PK-1');
    expect(logged).not.toContain(ORIGIN);
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
          frameId: 3,
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

  it('a top-frame sender (frameId 0) reaches the dispatch as frameId 0', async () => {
    const { store, dispatch } = makeStore();

    await handleSdkMethod(
      sdkMethod.signMessageRequest(
        { message: 'hi', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER_TOP_FRAME,
      store
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          frameId: 0,
          origin: ORIGIN,
          method: 'signMessage'
        }
      })
    );
  });

  it('refused at the open-request cap → signMessageResponse(cancelled), no window', async () => {
    const { store, dispatch } = makeStore();
    dispatch.mockImplementation(() => {});

    const result = await handleSdkMethod(
      sdkMethod.signMessageRequest(
        { message: 'hi', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.signMessageResponse({ cancelled: true }, META)
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: windowRequestOpened.type })
    );
    expect(openWindowMock).not.toHaveBeenCalled();
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
          frameId: 3,
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

  it('dispatches the eip712 payload and the descriptor in one synchronous block', async () => {
    const { store, dispatch } = makeStore();
    const seen = watchGapBeforeDescriptor(dispatch, eip712PayloadReceived.type);

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

    expect(seen.microtaskRanBeforeDescriptor).toBe(false);
  });

  it('payload write refused at capacity → cancelled response, no window', async () => {
    selectEip712JsonByIdMock.mockReturnValue({});
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

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.signTypedDataResponse(
        {
          cancelled: true,
          signature: null,
          digest: null,
          publicKey: null,
          error: 'Too many pending signature requests',
          errorCode: SdkErrorCode.tooManyPendingRequests
        },
        { requestId: 'req-1' }
      )
    });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  it('a capacity refusal is surfaced in the extension log, identifiers only', async () => {
    selectEip712JsonByIdMock.mockReturnValue({});
    const { store } = makeStore();

    await handleSdkMethod(
      sdkMethod.signTypedDataRequest(
        {
          typedData: { foo: 'secret' } as any,
          options: undefined,
          signingPublicKeyHex: 'PK-1'
        },
        META
      ),
      SENDER,
      store
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), {
      requestId: 'req-1',
      method: sdkMethod.signTypedDataRequest.type
    });
    const logged = JSON.stringify(consoleErrorSpy.mock.calls);
    expect(logged).not.toContain('secret');
    expect(logged).not.toContain(ORIGIN);
  });

  it('a prototype-name requestId reads as absent, not as an inherited member', async () => {
    selectEip712JsonByIdMock.mockReturnValue({});
    const { store, dispatch } = makeStore();

    const result = await handleSdkMethod(
      sdkMethod.signTypedDataRequest(
        {
          typedData: { foo: 'bar' } as any,
          options: undefined,
          signingPublicKeyHex: 'PK-1'
        },
        { requestId: 'constructor' }
      ),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.signTypedDataResponse(
        {
          cancelled: true,
          signature: null,
          digest: null,
          publicKey: null,
          error: 'Too many pending signature requests',
          errorCode: SdkErrorCode.tooManyPendingRequests
        },
        { requestId: 'constructor' }
      )
    });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  it('a falsy stored payload counts as present', async () => {
    selectEip712JsonByIdMock.mockReturnValue({ [META.requestId]: '' });
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

    expect(result).toEqual({ handled: true, response: undefined });
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(openWindowMock).toHaveBeenCalledWith(
      store,
      expect.objectContaining({ windowApp: WindowApp.SignatureRequestEip712 })
    );
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

  it('a top-frame sender (frameId 0) reaches the dispatch as frameId 0', async () => {
    const { store, dispatch } = makeStore();

    await handleSdkMethod(
      sdkMethod.signTypedDataRequest(
        {
          typedData: { foo: 'bar' } as any,
          options: undefined,
          signingPublicKeyHex: 'PK-1'
        },
        META
      ),
      SENDER_TOP_FRAME,
      store
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          frameId: 0,
          origin: ORIGIN,
          method: 'signTypedData'
        }
      })
    );
  });

  it('refused at the open-request cap → the payload-cap-style cancelled response, no window', async () => {
    // Payload cap has room (default mock), only the open-request cap refuses —
    // so, unlike the payload-cap refusal above, the payload dispatch DOES land
    // and only the descriptor dispatch is refused: the accepted eip712 payload
    // is left stranded for `reconcileStalePayloadsSaga` to reclaim.
    const { store, dispatch } = makeStore();
    dispatch.mockImplementation(() => {});

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

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.signTypedDataResponse(
        {
          cancelled: true,
          signature: null,
          digest: null,
          publicKey: null,
          error: 'Too many pending signature requests',
          errorCode: SdkErrorCode.tooManyPendingRequests
        },
        { requestId: 'req-1' }
      )
    });
    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: windowRequestOpened.type })
    );
    // Reclaims the stranded eip712 payload immediately — same mechanism as
    // the `sign` branch's equivalent assertion.
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: windowRequestResponded.type,
        payload: { requestId: 'req-1' }
      })
    );
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  it('an open-request-cap refusal is logged, distinct from the payload-cap message, identifiers only', async () => {
    const { store, dispatch } = makeStore();
    dispatch.mockImplementation(() => {});

    await handleSdkMethod(
      sdkMethod.signTypedDataRequest(
        {
          typedData: { foo: 'secret' } as any,
          options: undefined,
          signingPublicKeyHex: 'PK-1'
        },
        META
      ),
      SENDER,
      store
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('open-request map at capacity'),
      {
        requestId: 'req-1',
        method: sdkMethod.signTypedDataRequest.type,
        openCount: 0
      }
    );
    const logged = JSON.stringify(consoleErrorSpy.mock.calls);
    expect(logged).not.toContain('secret');
    expect(logged).not.toContain(ORIGIN);
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
          frameId: 3,
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

  it('a top-frame sender (frameId 0) reaches the dispatch as frameId 0', async () => {
    const { store, dispatch } = makeStore();

    await handleSdkMethod(
      sdkMethod.decryptMessageRequest(
        { message: 'enc', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER_TOP_FRAME,
      store
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          requestId: 'req-1',
          tabId: 9,
          frameId: 0,
          origin: ORIGIN,
          method: 'decryptMessage'
        }
      })
    );
  });

  it('refused at the open-request cap → decryptMessageResponse(cancelled), no window', async () => {
    const { store, dispatch } = makeStore();
    dispatch.mockImplementation(() => {});

    const result = await handleSdkMethod(
      sdkMethod.decryptMessageRequest(
        { message: 'enc', signingPublicKeyHex: 'PK-1' },
        META
      ),
      SENDER,
      store
    );

    expect(result).toEqual({
      handled: true,
      response: sdkMethod.decryptMessageResponse({ cancelled: true }, META)
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: windowRequestOpened.type })
    );
    expect(openWindowMock).not.toHaveBeenCalled();
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

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('public key hex invalid'),
      expect.anything()
    );
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

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('message encryption failed'),
      expect.anything()
    );
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
