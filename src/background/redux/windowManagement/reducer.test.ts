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
    expect(state.requests.r1).toEqual({ status: 'responded' });

    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));
    expect(state.requests.r1).toEqual({ status: 'responded' });
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
      windowIds: []
    });

    // Responding twice must not throw or resurrect the dropped descriptor.
    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));
    expect(state.requests.r1).toEqual({ status: 'responded' });
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
      windowIds: []
    });
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

    expect(state.requests.r1).toEqual({ status: 'responded' });
  });

  it('a reused requestId does not resurrect a tombstone', () => {
    let state = reducer(empty, opened('r1'));
    state = reducer(state, windowRequestResponded({ requestId: 'r1' }));
    const next = reducer(state, opened('r1'));

    expect(next).toBe(state);
    expect(next.requests.r1).toEqual({ status: 'responded' });
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
        withHole,
        windowRequestResponded({ requestId: 'r1' })
      );

      expect(next.requests.r1).toEqual({ status: 'responded' });
      expect(Object.keys(next.requests)).toContain('ghost');
    });
  });

  describe('tombstone eviction', () => {
    it('caps the responded entries instead of growing for the whole session', () => {
      // Nothing ever deleted a key. On MV3 a service-worker restart eventually
      // wiped the map, but `manifest.v2.json` and `manifest.v2.safari.json`
      // both declare `"persistent": true` — on Firefox and Safari the
      // background page is never torn down, so this grew by one permanent
      // entry per request, keyed by a dapp-supplied string, for the entire
      // browser session.
      let state = empty;
      for (let i = 0; i < MAX_RESPONDED_TOMBSTONES + 10; i++) {
        state = reducer(state, windowRequestResponded({ requestId: `r${i}` }));
      }

      expect(Object.keys(state.requests)).toHaveLength(
        MAX_RESPONDED_TOMBSTONES
      );
      // Oldest evicted, newest kept: a late duplicate is most likely to arrive
      // for a request that was answered recently.
      expect(state.requests.r0).toBeUndefined();
      expect(state.requests[`r${MAX_RESPONDED_TOMBSTONES + 9}`]).toEqual({
        status: 'responded'
      });
    });

    it('never evicts an open request to make room', () => {
      let state = reducer(empty, opened('still-open'));
      for (let i = 0; i < MAX_RESPONDED_TOMBSTONES + 10; i++) {
        state = reducer(state, windowRequestResponded({ requestId: `r${i}` }));
      }

      expect(state.requests['still-open']).toMatchObject({ status: 'open' });
    });
  });
});
