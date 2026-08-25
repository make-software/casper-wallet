import {
  connectWindowInit,
  exportKeysWindowIdChanged,
  exportKeysWindowIdCleared,
  importWindowInit,
  onboardingAppInit,
  popupWindowInit,
  signWindowInit,
  windowDetachedFromRequests,
  windowIdChanged,
  windowIdCleared,
  windowManagementReseted,
  windowRequestDeviceConfirmationChanged,
  windowRequestOpened,
  windowRequestResponded,
  windowRequestWindowAttached
} from './actions';
import { MAX_RESPONDED_TOMBSTONES, reducer } from './reducer';
import { WindowManagementState } from './types';

const empty: WindowManagementState = {
  windowId: null,
  exportKeysWindowId: null,
  requests: {}
};

const opened = (requestId: string) =>
  windowRequestOpened({
    requestId,
    tabId: 3,
    origin: 'https://dapp',
    method: 'sign'
  });

describe('windowManagement reducer', () => {
  it('has null windowId and no requests initially', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual({
      windowId: null,
      exportKeysWindowId: null,
      requests: {}
    });
  });

  it('sets and clears windowId', () => {
    const s = reducer(empty, windowIdChanged(7));
    expect(s).toEqual({
      windowId: 7,
      exportKeysWindowId: null,
      requests: {}
    });
    expect(reducer(s, windowIdCleared())).toEqual({
      windowId: null,
      exportKeysWindowId: null,
      requests: {}
    });
  });

  it('window-init actions do not change state', () => {
    const state: WindowManagementState = {
      windowId: 7,
      exportKeysWindowId: null,
      requests: {}
    };
    expect(reducer(state, onboardingAppInit())).toEqual(state);
    expect(reducer(state, popupWindowInit())).toEqual(state);
    expect(reducer(state, connectWindowInit())).toEqual(state);
    expect(reducer(state, importWindowInit())).toEqual(state);
    expect(reducer(state, signWindowInit())).toEqual(state);
  });

  it('windowIdCleared nulls only windowId', () => {
    const next = reducer({ ...empty, windowId: 5 }, windowIdCleared());
    expect(next.windowId).toBeNull();
  });

  it('sets and clears exportKeysWindowId, independently of windowId', () => {
    const set = reducer(empty, exportKeysWindowIdChanged(12));
    expect(set.exportKeysWindowId).toBe(12);
    expect(set.windowId).toBeNull();

    const cleared = reducer(set, exportKeysWindowIdCleared());
    expect(cleared.exportKeysWindowId).toBeNull();
  });

  it('marks a request as responded, and is idempotent on a second respond', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));
    expect(state.requests.r1).toEqual({ status: 'responded', seq: 1 });

    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));
    expect(state.requests.r1).toEqual({ status: 'responded', seq: 1 });
  });

  it('leaves a still-open sibling untouched when one request is answered', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(
      state,
      windowRequestOpened({
        requestId: 'r2',
        tabId: 9,
        origin: 'https://other.example',
        method: 'signMessage'
      })
    );
    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));
    expect(state.requests.r2).toEqual({
      status: 'open',
      tabId: 9,
      origin: 'https://other.example',
      method: 'signMessage',
      windowIds: [],
      awaitingDeviceConfirmation: false,
      seq: 1
    });

    // Responding twice must not throw or resurrect the dropped descriptor.
    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));
    expect(state.requests.r1).toEqual({ status: 'responded', seq: 2 });
  });

  it('windowManagementReseted wipes windowId, exportKeysWindowId and every request', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(state, windowIdChanged(7));
    state = reducer(state, exportKeysWindowIdChanged(12));

    expect(reducer(state, windowManagementReseted())).toEqual({
      windowId: null,
      exportKeysWindowId: null,
      requests: {}
    });
  });

  it('windowManagementReseted returns the shared initialState reference', () => {
    // Load-bearing for spec §8.3: the get-main-store.ts subscriber guard
    // compares `requests`/`windowId` by reference, so a state that was already
    // at rest must reset to the SAME object — the reset flow does not rely on
    // that guard to persist the clear, but the identity is still the contract
    // this reducer promises every other reset case.
    const first = reducer(empty, windowManagementReseted());
    const second = reducer(first, windowManagementReseted());

    expect(first).toBe(second);
  });
});

describe('windowManagement requests', () => {
  it('opens a request with no windows attached yet', () => {
    const state = reducer(empty, opened('r1'));

    expect(state.requests.r1).toEqual({
      status: 'open',
      tabId: 3,
      origin: 'https://dapp',
      method: 'sign',
      windowIds: [],
      awaitingDeviceConfirmation: false,
      seq: 0
    });
  });

  it('windowRequestOpened records the requesting frame', () => {
    const state = reducer(
      undefined,
      windowRequestOpened({
        requestId: 'r1',
        tabId: 3,
        frameId: 4,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );

    expect(state.requests.r1).toEqual({
      status: 'open',
      tabId: 3,
      frameId: 4,
      origin: 'https://dapp.example',
      method: 'sign',
      windowIds: [],
      awaitingDeviceConfirmation: false,
      seq: 0
    });
  });

  it('windowRequestOpened records frameId 0 rather than erasing it', () => {
    // `0` is the top-frame value and falsy, so `action.payload.frameId ||
    // undefined` would erase exactly this case while leaving `frameId: 4`
    // above untouched — assert the WHOLE descriptor so an erased `0` cannot
    // pass as a `toEqual`-ignored `undefined` key.
    const state = reducer(
      undefined,
      windowRequestOpened({
        requestId: 'r1',
        tabId: 3,
        frameId: 0,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );

    expect(state.requests.r1).toEqual({
      status: 'open',
      tabId: 3,
      frameId: 0,
      origin: 'https://dapp.example',
      method: 'sign',
      windowIds: [],
      awaitingDeviceConfirmation: false,
      seq: 0
    });
  });

  it('windowRequestOpened without a frame leaves the descriptor unscoped', () => {
    const state = reducer(
      undefined,
      windowRequestOpened({
        requestId: 'r1',
        tabId: 3,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );

    expect((state.requests.r1 as { frameId?: number }).frameId).toBeUndefined();
  });

  it('attaches a window id to an open request', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(
      state,
      windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
    );

    expect(state.requests.r1).toMatchObject({ windowIds: [7] });
  });

  it('attaches a second window (Ledger permission window) to the same request', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(
      state,
      windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
    );
    state = reducer(
      state,
      windowRequestWindowAttached({ requestId: 'r1', windowId: 9 })
    );

    expect(state.requests.r1).toMatchObject({ windowIds: [7, 9] });
  });

  it('ignores a duplicate attach of the same window', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(
      state,
      windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
    );
    const next = reducer(
      state,
      windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
    );

    expect(next).toBe(state);
  });

  it('ignores an attach to an unknown or responded request', () => {
    const unknown = reducer(
      empty,
      windowRequestWindowAttached({ requestId: 'nope', windowId: 7 })
    );
    expect(unknown).toBe(empty);

    let state = reducer(empty, opened('r1'));
    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));
    const next = reducer(
      state,
      windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
    );
    expect(next).toBe(state);
  });

  it('detaches one window and leaves the other attached', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(
      state,
      windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
    );
    state = reducer(
      state,
      windowRequestWindowAttached({ requestId: 'r1', windowId: 9 })
    );
    state = reducer(state, windowDetachedFromRequests({ windowId: 7 }));

    expect(state.requests.r1).toMatchObject({ windowIds: [9] });
  });

  it('detach is a no-op when no request holds that window', () => {
    const state = reducer(empty, opened('r1'));
    expect(reducer(state, windowDetachedFromRequests({ windowId: 7 }))).toBe(
      state
    );
  });

  it('responding replaces the descriptor with a tombstone', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));

    expect(state.requests.r1).toEqual({ status: 'responded', seq: 1 });
  });

  it('a reused requestId does not resurrect a tombstone', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));
    const next = reducer(state, opened('r1'));

    expect(next).toBe(state);
    expect(next.requests.r1).toEqual({ status: 'responded', seq: 1 });
  });

  it('a reused requestId does not clobber a still-open descriptor', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(
      state,
      windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
    );
    const next = reducer(
      state,
      windowRequestOpened({
        requestId: 'r1',
        tabId: 99,
        origin: 'https://other',
        method: 'connect'
      })
    );

    expect(next).toBe(state);
    expect(next.requests.r1).toMatchObject({ tabId: 3, windowIds: [7] });
  });

  describe('a requestId that collides with an Object.prototype member', () => {
    // `requestId` is dapp-controlled and the map is a plain object, so
    // `requests[id]` can read an INHERITED member. Reading it with `!= null`
    // and with `?.status` then disagree — and the SDK entry guard used the
    // second while this reducer used the first, so one of five string literals
    // was refused registration here while the caller was told it was fresh: an
    // approval window for a request the model never knew about.
    it.each(['toString', 'constructor', 'valueOf', 'hasOwnProperty'])(
      'registers %s like any other id',
      key => {
        const state = reducer(empty, opened(key));

        expect(Object.prototype.hasOwnProperty.call(state.requests, key)).toBe(
          true
        );
        expect(state.requests[key]).toMatchObject({
          status: 'open',
          tabId: 3,
          windowIds: []
        });
      }
    );

    it('still refuses a SECOND registration of such an id', () => {
      const state = reducer(empty, opened('toString'));
      const next = reducer(state, opened('toString'));

      expect(next).toBe(state);
    });

    it('attaches a window to such an id', () => {
      let state = reducer(empty, opened('toString'));
      state = reducer(
        state,
        windowRequestWindowAttached({ requestId: 'toString', windowId: 7 })
      );

      expect(state.requests.toString).toMatchObject({ windowIds: [7] });
    });

    it('refuses `__proto__` outright, leaving the map untouched', () => {
      // Unlike the other four this one cannot be stored at all: the copy immer
      // makes assigns the key, and assigning `__proto__` sets the object's
      // PROTOTYPE instead of adding an entry — so the descriptor would become
      // the prototype of every later lookup in the map.
      const next = reducer(empty, opened('__proto__'));

      expect(next).toBe(empty);
      expect(Object.getPrototypeOf(next.requests)).toBe(Object.prototype);
    });
  });

  describe('a hole in the requests map is skipped, not crashed on', () => {
    // `requests` is `Partial<Record<…>>` so that the existence guards are real
    // code to the compiler rather than provably-dead branches. That makes an
    // explicitly `undefined` entry representable — persistence rehydration and
    // `delete`-based eviction both produce shapes near this — so the two places
    // that walk the whole map must tolerate it.
    const withHole = { ...empty, requests: { ghost: undefined } };

    it('windowDetachedFromRequests leaves it alone', () => {
      expect(
        reducer(withHole, windowDetachedFromRequests({ windowId: 7 }))
      ).toBe(withHole);
    });

    it('the tombstone sweep does not count it as responded', () => {
      const next = reducer(
        reducer(withHole, opened('r1')),
        windowRequestResponded({ requestId: 'r1' })
      );

      expect(next.requests.r1).toEqual({ status: 'responded', seq: 1 });
      expect(Object.keys(next.requests)).toContain('ghost');
    });
  });

  describe('the tombstone is a transition, not an upsert', () => {
    // Its two siblings refuse to act on a missing or wrong-status entry; this
    // one wrote unconditionally, so the union modelled ∅ → open → responded
    // while the reducer permitted ∅ → responded. Reachable whenever the UI
    // forwards a response for an id the store no longer has — one of the
    // residual descriptor-less paths — and the orphan then consumes a slot in
    // the tombstone cap and makes the SDK entry guard reject that id as a
    // duplicate.
    it('refuses to tombstone a requestId that was never registered', () => {
      const next = reducer(
        empty,
        windowRequestResponded({ requestId: 'ghost' })
      );

      expect(next).toBe(empty);
    });

    it('refuses to tombstone an already responded request again', () => {
      let state = reducer(empty, opened('r1'));
      state = reducer(state, windowRequestResponded({ requestId: 'r1' }));

      const next = reducer(state, windowRequestResponded({ requestId: 'r1' }));

      expect(next).toBe(state);
    });
  });

  describe('tombstone eviction', () => {
    it('caps the responded entries instead of growing for the whole session', () => {
      // Nothing ever deleted a key. Before the session mirror, an MV3
      // service-worker restart eventually wiped the map; now Chrome/Edge
      // tombstones survive it too (residual paths aside). But
      // `manifest.v2.json` and `manifest.v2.safari.json` both declare
      // `"persistent": true` — on Firefox and Safari the background page is
      // never torn down, so this grows by one permanent entry per request,
      // keyed by a dapp-supplied string, for the entire browser session.
      let state = empty;
      for (let i = 0; i < MAX_RESPONDED_TOMBSTONES + 10; i++) {
        state = reducer(state, opened(`r${i}`));
        state = reducer(state, windowRequestResponded({ requestId: `r${i}` }));
      }

      expect(Object.keys(state.requests)).toHaveLength(
        MAX_RESPONDED_TOMBSTONES
      );
      // Oldest evicted, newest kept: a late duplicate is most likely to arrive
      // for a request that was answered recently.
      expect(state.requests.r0).toBeUndefined();
      // Each iteration consumes two ordinals (open, then the respond restamp),
      // so the last of MAX_RESPONDED_TOMBSTONES + 10 iterations lands here.
      expect(state.requests[`r${MAX_RESPONDED_TOMBSTONES + 9}`]).toEqual({
        status: 'responded',
        seq: 2 * MAX_RESPONDED_TOMBSTONES + 19
      });
    });

    // Eviction ranked on `Object.keys`, whose order is not registration order:
    // an integer-like dapp-chosen key is enumerated ahead of every string key
    // however recently it was written, so `"42"` was always evicted first.
    it('does not evict an integer-like key ahead of older string-keyed tombstones', () => {
      let state = empty;
      for (let i = 0; i < MAX_RESPONDED_TOMBSTONES; i++) {
        state = reducer(state, opened(`r${i}`));
        state = reducer(state, windowRequestResponded({ requestId: `r${i}` }));
      }

      state = reducer(state, opened('42'));
      state = reducer(state, windowRequestResponded({ requestId: '42' }));

      expect(Object.keys(state.requests)).toHaveLength(
        MAX_RESPONDED_TOMBSTONES
      );
      expect(state.requests['42']).toEqual({
        status: 'responded',
        seq: 2 * MAX_RESPONDED_TOMBSTONES + 1
      });
      expect(state.requests.r0).toBeUndefined();
    });

    // Eviction is oldest-ANSWERED-first, not oldest-REGISTERED-first: a
    // request that registered before every other one but is answered last
    // must get the highest seq and outlive tombstones for requests that
    // registered later but were answered sooner. Restamping the tombstone at
    // respond time (rather than keeping the registration seq) is what makes
    // this hold — otherwise `first` would answer with its own registration
    // seq of 0, making it the lowest-seq (oldest) tombstone and evicting
    // itself in the very dispatch that created it.
    it('a request registered first but answered last survives eviction over an earlier-answered tombstone', () => {
      let state = reducer(empty, opened('first'));

      for (let i = 0; i < MAX_RESPONDED_TOMBSTONES; i++) {
        state = reducer(state, opened(`r${i}`));
        state = reducer(state, windowRequestResponded({ requestId: `r${i}` }));
      }

      state = reducer(state, windowRequestResponded({ requestId: 'first' }));

      expect(Object.keys(state.requests)).toHaveLength(
        MAX_RESPONDED_TOMBSTONES
      );
      expect(state.requests.r0).toBeUndefined();
      expect(state.requests.first).toEqual({
        status: 'responded',
        seq: 2 * MAX_RESPONDED_TOMBSTONES + 1
      });
    });

    it('stamps the first request of an empty map with the first ordinal', () => {
      expect(reducer(empty, opened('r1')).requests.r1).toMatchObject({
        seq: 0
      });
    });

    // Re-stamping would let a page promote its own tombstone past older ones
    // by re-sending an id it already used.
    it('does not re-stamp the ordinal of an id that is re-sent', () => {
      let state = reducer(empty, opened('r1'));
      state = reducer(state, opened('r2'));
      state = reducer(state, opened('r1'));

      expect(state.requests.r1).toMatchObject({ seq: 0 });
      expect(state.requests.r2).toMatchObject({ seq: 1 });
    });

    // The sequence names only ids the map actually holds, so a refused write
    // cannot leak a slot of its own.
    it('consumes no ordinal for a refused write', () => {
      let state = reducer(empty, opened('r1'));
      state = reducer(state, opened('__proto__'));
      state = reducer(state, opened('r1'));
      state = reducer(state, opened('r2'));

      expect(state.requests.r2).toMatchObject({ seq: 1 });
    });

    it('never evicts an open request to make room', () => {
      let state = reducer(empty, opened('still-open'));
      for (let i = 0; i < MAX_RESPONDED_TOMBSTONES + 10; i++) {
        state = reducer(state, opened(`r${i}`));
        state = reducer(state, windowRequestResponded({ requestId: `r${i}` }));
      }

      expect(state.requests['still-open']).toMatchObject({ status: 'open' });
    });
  });
});

describe('windowManagement device confirmation', () => {
  it('opens a request that is not awaiting the device', () => {
    const state = reducer(empty, opened('r1'));

    expect(state.requests.r1).toMatchObject({
      awaitingDeviceConfirmation: false
    });
  });

  it('marks an open request as awaiting the device', () => {
    let state = reducer(empty, opened('r1'));

    state = reducer(
      state,
      windowRequestDeviceConfirmationChanged({
        requestId: 'r1',
        awaiting: true
      })
    );

    expect(state.requests.r1).toMatchObject({
      awaitingDeviceConfirmation: true
    });
  });

  it('clears the flag when the confirmation ends', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(
      state,
      windowRequestDeviceConfirmationChanged({
        requestId: 'r1',
        awaiting: true
      })
    );

    state = reducer(
      state,
      windowRequestDeviceConfirmationChanged({
        requestId: 'r1',
        awaiting: false
      })
    );

    expect(state.requests.r1).toMatchObject({
      awaitingDeviceConfirmation: false
    });
  });

  // The tombstone carries no descriptor to flag, and resurrecting one would
  // hand `selectIsWindowBusyWithDevice` an answered request to protect.
  it('leaves a tombstone alone', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));

    const next = reducer(
      state,
      windowRequestDeviceConfirmationChanged({
        requestId: 'r1',
        awaiting: true
      })
    );

    expect(next).toBe(state);
  });

  it('ignores a request the store never registered', () => {
    const next = reducer(
      empty,
      windowRequestDeviceConfirmationChanged({
        requestId: 'ghost',
        awaiting: true
      })
    );

    expect(next).toBe(empty);
  });

  // Identity, not just equality. The store subscriber does no state-change
  // comparison, so every new object is a popupState broadcast to every replica
  // plus a full storage.local rewrite — the same cost `windowDetachedFromRequests`
  // gates its dispatch on. A repeated report must not pay it.
  it('returns the same state when the flag already holds that value', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(
      state,
      windowRequestDeviceConfirmationChanged({
        requestId: 'r1',
        awaiting: true
      })
    );

    const next = reducer(
      state,
      windowRequestDeviceConfirmationChanged({
        requestId: 'r1',
        awaiting: true
      })
    );

    expect(next).toBe(state);
  });
});
