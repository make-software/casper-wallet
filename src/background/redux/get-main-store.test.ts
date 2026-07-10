import type { KeysState } from '@background/redux/keys/types';

// --- storage / runtime mock -------------------------------------------------
// storage.local.get returns the per-test snapshot; set/remove/sendMessage are
// no-op spies that absorb the subscribe-persist write and the saga deadline
// clears armed by startBackground (no real timers are scheduled for a
// keys-only snapshot). This is the same mock style as the handler/saga tests.
const storageGet = jest.fn<Promise<Record<string, unknown>>, [unknown]>();
const storageSet = jest.fn().mockResolvedValue(undefined);
const storageRemove = jest.fn().mockResolvedValue(undefined);
const runtimeSendMessage = jest.fn().mockResolvedValue(undefined);

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: (...args: unknown[]) => storageGet(...(args as [unknown])),
      set: (...args: unknown[]) => storageSet(...args),
      remove: (...args: unknown[]) => storageRemove(...args)
    }
  },
  runtime: {
    sendMessage: (...args: unknown[]) => runtimeSendMessage(...args)
  },
  tabs: { query: jest.fn().mockResolvedValue([]) }
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
