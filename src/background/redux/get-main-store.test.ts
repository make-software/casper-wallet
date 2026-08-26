import type { KeysState } from '@background/redux/keys/types';
import {
  exportKeysWindowIdCleared,
  windowIdChanged,
  windowRequestOpened
} from '@background/redux/windowManagement/actions';
import { REQUEST_SESSION_KEY } from '@background/redux/windowManagement/session-store';

// --- storage / runtime mock -------------------------------------------------
// storage.local.get returns the per-test snapshot; set/remove/sendMessage are
// no-op spies that absorb the subscribe-persist write and the saga deadline
// clears armed by startBackground (no real timers are scheduled for a
// keys-only snapshot). This is the same mock style as the handler/saga tests.
// `storage.session` is here to exercise hydration, not to avoid a throw.
const storageGet = jest.fn<Promise<Record<string, unknown>>, [unknown]>();
const storageSet = jest.fn().mockResolvedValue(undefined);
const storageRemove = jest.fn().mockResolvedValue(undefined);
const runtimeSendMessage = jest.fn().mockResolvedValue(undefined);
const sessionGet = jest.fn<Promise<Record<string, unknown>>, [unknown]>();
const sessionSet = jest.fn().mockResolvedValue(undefined);

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: (...args: unknown[]) => storageGet(...(args as [unknown])),
      set: (...args: unknown[]) => storageSet(...args),
      remove: (...args: unknown[]) => storageRemove(...args)
    },
    session: {
      get: (...args: unknown[]) => sessionGet(...(args as [unknown])),
      set: (...args: unknown[]) => sessionSet(...args),
      remove: jest.fn().mockResolvedValue(undefined)
    }
  },
  runtime: {
    sendMessage: (...args: unknown[]) => runtimeSendMessage(...args)
  },
  tabs: { query: jest.fn().mockResolvedValue([]) }
}));

// The mirror is gated on a build-time flag that is FALSE under jest, so without
// this the hydration cases would exercise the disabled path.
jest.mock('@src/utils', () => ({
  ...jest.requireActual('@src/utils'),
  isEphemeralBackgroundBuild: true
}));

// Drive the REAL preload of getExistingMainStoreSingletonOrInit with a fresh
// module registry so the module-level `storeSingleton` let is undefined each
// time. Returns the initialised store.
async function initWithKeysSnapshot(keys: KeysState | undefined) {
  let store: Awaited<
    ReturnType<
      typeof import('@background/redux/get-main-store').getExistingMainStoreSingletonOrInit
    >
  >;
  await jest.isolateModulesAsync(async () => {
    const mod = await import('@background/redux/get-main-store');
    storageGet.mockResolvedValue(
      keys === undefined ? {} : { [mod.KEYS_KEY]: keys }
    );
    store = await mod.getExistingMainStoreSingletonOrInit();
  });
  // @ts-expect-error assigned inside isolateModulesAsync callback
  return store;
}

describe('getExistingMainStoreSingletonOrInit — keysDoesExist preload derivation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionGet.mockResolvedValue({});
    sessionSet.mockResolvedValue(undefined);
    storageSet.mockResolvedValue(undefined);
    storageRemove.mockResolvedValue(undefined);
    runtimeSendMessage.mockResolvedValue(undefined);
  });

  it('recomputes keysDoesExist=true when all hashes are present but the persisted flag is a poisoned false', async () => {
    const store = await initWithKeysSnapshot({
      passwordHash: 'x',
      passwordSaltHash: 'y',
      keyDerivationSaltHash: 'z',
      // Poisoned: contradicts the hashes. Must be ignored / recomputed.
      keysDoesExist: false
    });

    expect(store.getState().keys.keysDoesExist).toBe(true);
  });

  it('recomputes keysDoesExist=false when hashes are absent but the persisted flag is a poisoned true', async () => {
    const store = await initWithKeysSnapshot({
      passwordHash: null,
      passwordSaltHash: null,
      keyDerivationSaltHash: null,
      // Poisoned: contradicts the (absent) hashes. Must be ignored / recomputed.
      keysDoesExist: true
    });

    expect(store.getState().keys.keysDoesExist).toBe(false);
  });

  it('leaves keysDoesExist=false when there is no persisted keys slice at all', async () => {
    const store = await initWithKeysSnapshot(undefined);

    expect(store.getState().keys.keysDoesExist).toBe(false);
  });
});

// Every key the background pushes to UI replicas. Pinned exactly: a new slice
// must be an explicit decision, and `windowManagement` must stay narrowed to
// `windowId` — `requests` maps each in-flight requestId to its dapp origin and
// tabId, which no replica reads and every replica would otherwise receive.
const EXPECTED_POPUP_STATE_KEYS = [
  'accountInfo',
  'activeOrigin',
  'activeOriginFavicon',
  'appEvents',
  'contacts',
  'csprNameExpirations',
  'keys',
  'lastActivityTime',
  'ledger',
  'loginRetryCount',
  'loginRetryLockoutTime',
  'rateApp',
  'recentRecipientPublicKeys',
  'session',
  'settings',
  'trustedWasm',
  'vault',
  'windowManagement'
];

function lastPopupStateBroadcast(): Record<string, unknown> | undefined {
  const payloads = runtimeSendMessage.mock.calls
    .map(([message]) => message as { type?: string; payload?: unknown })
    .filter(message => message?.type === 'popupStateUpdated')
    .map(message => message.payload as Record<string, unknown>);

  return payloads[payloads.length - 1];
}

describe('selectPopupState broadcast — replica privacy narrowing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionGet.mockResolvedValue({});
    sessionSet.mockResolvedValue(undefined);
    storageSet.mockResolvedValue(undefined);
    storageRemove.mockResolvedValue(undefined);
    runtimeSendMessage.mockResolvedValue(undefined);
  });

  it('broadcasts exactly the expected slices, with windowManagement narrowed to windowId', async () => {
    const store = await initWithKeysSnapshot(undefined);

    store.dispatch(
      windowRequestOpened({
        requestId: 'req-1',
        tabId: 7,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );

    const payload = lastPopupStateBroadcast();

    expect(payload).toBeDefined();
    expect(Object.keys(payload!).sort()).toEqual(EXPECTED_POPUP_STATE_KEYS);
    expect(payload!.windowManagement).toEqual({ windowId: null });
  });

  it('never leaks an in-flight dapp origin or tabId into the broadcast', async () => {
    const store = await initWithKeysSnapshot(undefined);

    store.dispatch(
      windowRequestOpened({
        requestId: 'req-1',
        tabId: 7,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );

    // The request IS in the background store…
    expect(store.getState().windowManagement.requests['req-1']).toMatchObject({
      status: 'open',
      origin: 'https://dapp.example'
    });
    // …and must NOT be anywhere in what replicas receive.
    expect(JSON.stringify(lastPopupStateBroadcast())).not.toContain(
      'dapp.example'
    );
  });
});

describe('preload hydration — the session mirror', () => {
  const mirroredRequest = {
    status: 'open',
    tabId: 7,
    origin: 'https://dapp.example',
    method: 'sign',
    windowIds: [11],
    awaitingDeviceConfirmation: false,
    seq: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionGet.mockResolvedValue({});
    sessionSet.mockResolvedValue(undefined);
    storageSet.mockResolvedValue(undefined);
    storageRemove.mockResolvedValue(undefined);
    runtimeSendMessage.mockResolvedValue(undefined);
  });

  it('puts a mirrored request map and windowId into the store before any handler can run', async () => {
    sessionGet.mockResolvedValue({
      [REQUEST_SESSION_KEY]: {
        requests: { 'req-1': mirroredRequest },
        windowId: 3
      }
    });

    const store = await initWithKeysSnapshot(undefined);

    expect(store.getState().windowManagement).toEqual({
      windowId: 3,
      exportKeysWindowId: null,
      requests: { 'req-1': mirroredRequest }
    });
  });

  it('drops a malformed record without throwing, leaving the empty slice', async () => {
    sessionGet.mockResolvedValue({
      [REQUEST_SESSION_KEY]: {
        requests: { 'req-1': { status: 'open', tabId: '7' } },
        windowId: 'not a window'
      }
    });

    const store = await initWithKeysSnapshot(undefined);

    expect(store.getState().windowManagement).toEqual({
      windowId: null,
      exportKeysWindowId: null,
      requests: {}
    });
  });

  it('survives a rejected session read', async () => {
    sessionGet.mockRejectedValue('context invalidated');
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const store = await initWithKeysSnapshot(undefined);

    expect(store.getState().windowManagement.requests).toEqual({});
    consoleErrorSpy.mockRestore();
  });

  it('keeps a hydrated request out of the replica broadcast', async () => {
    sessionGet.mockResolvedValue({
      [REQUEST_SESSION_KEY]: {
        requests: { 'req-1': mirroredRequest },
        windowId: 3
      }
    });

    const store = await initWithKeysSnapshot(undefined);
    store.dispatch(windowIdChanged(11));

    expect(JSON.stringify(lastPopupStateBroadcast())).not.toContain(
      'dapp.example'
    );
  });

  it('mirrors a request the store registers after hydration', async () => {
    const store = await initWithKeysSnapshot(undefined);

    store.dispatch(
      windowRequestOpened({
        requestId: 'req-1',
        tabId: 7,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );
    await new Promise(resolve => setImmediate(resolve as () => void));

    expect(sessionSet).toHaveBeenCalledWith({
      [REQUEST_SESSION_KEY]: {
        // No window has attached yet at registration time.
        requests: { 'req-1': { ...mirroredRequest, windowIds: [] } },
        windowId: null
      }
    });
  });

  it('does not write the mirror for a change that leaves the pair identical', async () => {
    const store = await initWithKeysSnapshot(undefined);
    sessionSet.mockClear();

    // No no-op path: the reducer returns a fresh slice for a value-equal write.
    store.dispatch(exportKeysWindowIdCleared());
    await new Promise(resolve => setImmediate(resolve as () => void));

    expect(sessionSet).not.toHaveBeenCalled();
  });

  it('yields ONE store for two interleaved first callers', async () => {
    await jest.isolateModulesAsync(async () => {
      const mod = await import('@background/redux/get-main-store');
      storageGet.mockResolvedValue({});

      const [first, second] = await Promise.all([
        mod.getExistingMainStoreSingletonOrInit(),
        mod.getExistingMainStoreSingletonOrInit()
      ]);

      expect(first).toBe(second);
    });
  });
});

describe('replica broadcast — rejection handling', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionGet.mockResolvedValue({});
    sessionSet.mockResolvedValue(undefined);
    storageSet.mockResolvedValue(undefined);
    storageRemove.mockResolvedValue(undefined);
    runtimeSendMessage.mockResolvedValue(undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const flushMicrotasks = () =>
    new Promise(resolve => setImmediate(resolve as () => void));

  it('stays silent when no replica is listening', async () => {
    const store = await initWithKeysSnapshot(undefined);
    consoleErrorSpy.mockClear();
    runtimeSendMessage.mockRejectedValue(
      new Error('Could not establish connection. Receiving end does not exist.')
    );

    store.dispatch(windowIdChanged(11));
    await flushMicrotasks();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('reports any other rejection instead of hiding a stale replica', async () => {
    const store = await initWithKeysSnapshot(undefined);
    consoleErrorSpy.mockClear();
    runtimeSendMessage.mockRejectedValue(
      new Error('DataCloneError: value could not be cloned')
    );

    store.dispatch(windowIdChanged(11));
    await flushMicrotasks();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('popupStateUpdated'),
      expect.objectContaining({
        message: expect.stringContaining('DataCloneError')
      })
    );
  });

  it('stays silent when the rejection is a bare string, not an Error', async () => {
    const store = await initWithKeysSnapshot(undefined);
    consoleErrorSpy.mockClear();
    // Some polyfills reject with a plain string rather than an Error. The
    // guard must match on the message text regardless of the rejection's
    // type, or every store change with no popup open would log.
    runtimeSendMessage.mockRejectedValue(
      'Could not establish connection. Receiving end does not exist.'
    );

    store.dispatch(windowIdChanged(11));
    await flushMicrotasks();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
