import {
  connectWindowInit,
  importWindowInit,
  onboardingAppInit,
  popupWindowInit,
  signWindowInit,
  windowClosed,
  windowIdChanged,
  windowIdCleared,
  windowRequestOpened,
  windowRequestResponded
} from './actions';
import { reducer } from './reducer';

describe('windowManagement reducer', () => {
  it('has null windowId and no requests initially', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual({
      windowId: null,
      requests: {}
    });
  });
  it('sets and clears windowId', () => {
    const s = reducer({ windowId: null, requests: {} }, windowIdChanged(7));
    expect(s).toEqual({ windowId: 7, requests: {} });
    expect(reducer(s, windowIdCleared())).toEqual({
      windowId: null,
      requests: {}
    });
  });
  it('window-init actions do not change state', () => {
    const state = { windowId: 7, requests: {} };
    expect(reducer(state, onboardingAppInit())).toEqual(state);
    expect(reducer(state, popupWindowInit())).toEqual(state);
    expect(reducer(state, connectWindowInit())).toEqual(state);
    expect(reducer(state, importWindowInit())).toEqual(state);
    expect(reducer(state, signWindowInit())).toEqual(state);
  });

  it('opens a request', () => {
    const s = reducer(
      { windowId: null, requests: {} },
      windowRequestOpened({ requestId: 'r1' })
    );
    expect(s.requests.r1).toBe('open');
  });

  it('marks a request as responded, and is idempotent on a second respond', () => {
    let s = reducer(
      { windowId: null, requests: {} },
      windowRequestOpened({ requestId: 'r1' })
    );
    s = reducer(s, windowRequestResponded({ requestId: 'r1' }));
    expect(s.requests.r1).toBe('responded');

    s = reducer(s, windowRequestResponded({ requestId: 'r1' }));
    expect(s.requests.r1).toBe('responded');
  });

  it('closes open requests and clears windowId on windowClosed', () => {
    let s = reducer(
      { windowId: 7, requests: {} },
      windowRequestOpened({ requestId: 'r2' })
    );
    s = reducer(s, windowClosed());
    expect(s.requests.r2).toBe('closed');
    expect(s.windowId).toBeNull();
  });

  it('leaves a responded request as responded on windowClosed', () => {
    let s = reducer(
      { windowId: 7, requests: {} },
      windowRequestOpened({ requestId: 'r3' })
    );
    s = reducer(s, windowRequestResponded({ requestId: 'r3' }));
    s = reducer(s, windowClosed());
    expect(s.requests.r3).toBe('responded');
    expect(s.windowId).toBeNull();
  });
});
