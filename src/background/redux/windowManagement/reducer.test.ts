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

const empty = { windowId: null, requests: {}, pendingRequests: {} } as const;

describe('windowManagement reducer', () => {
  it('has null windowId and no requests initially', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual({
      windowId: null,
      requests: {},
      pendingRequests: {}
    });
  });
  it('sets and clears windowId', () => {
    const s = reducer(
      { windowId: null, requests: {}, pendingRequests: {} },
      windowIdChanged(7)
    );
    expect(s).toEqual({ windowId: 7, requests: {}, pendingRequests: {} });
    expect(reducer(s, windowIdCleared())).toEqual({
      windowId: null,
      requests: {},
      pendingRequests: {}
    });
  });
  it('window-init actions do not change state', () => {
    const state = { windowId: 7, requests: {}, pendingRequests: {} };
    expect(reducer(state, onboardingAppInit())).toEqual(state);
    expect(reducer(state, popupWindowInit())).toEqual(state);
    expect(reducer(state, connectWindowInit())).toEqual(state);
    expect(reducer(state, importWindowInit())).toEqual(state);
    expect(reducer(state, signWindowInit())).toEqual(state);
  });

  it('opens a request', () => {
    const s = reducer(
      { windowId: null, requests: {}, pendingRequests: {} },
      windowRequestOpened({
        requestId: 'r1',
        tabId: 9,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );
    expect(s.requests.r1).toBe('open');
  });

  it('marks a request as responded, and is idempotent on a second respond', () => {
    let s = reducer(
      { windowId: null, requests: {}, pendingRequests: {} },
      windowRequestOpened({
        requestId: 'r1',
        tabId: 9,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );
    s = reducer(s, windowRequestResponded({ requestId: 'r1' }));
    expect(s.requests.r1).toBe('responded');

    s = reducer(s, windowRequestResponded({ requestId: 'r1' }));
    expect(s.requests.r1).toBe('responded');
  });

  it('closes open requests and clears windowId on windowClosed', () => {
    let s = reducer(
      { windowId: 7, requests: {}, pendingRequests: {} },
      windowRequestOpened({
        requestId: 'r2',
        tabId: 9,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );
    s = reducer(s, windowClosed());
    expect(s.requests.r2).toBe('closed');
    expect(s.windowId).toBeNull();
  });

  it('leaves a responded request as responded on windowClosed', () => {
    let s = reducer(
      { windowId: 7, requests: {}, pendingRequests: {} },
      windowRequestOpened({
        requestId: 'r3',
        tabId: 9,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );
    s = reducer(s, windowRequestResponded({ requestId: 'r3' }));
    s = reducer(s, windowClosed());
    expect(s.requests.r3).toBe('responded');
    expect(s.windowId).toBeNull();
  });

  it('windowRequestOpened sets status open AND stores the descriptor', () => {
    const next = reducer(
      empty,
      windowRequestOpened({
        requestId: 'r1',
        tabId: 9,
        origin: 'https://dapp.example',
        method: 'sign'
      })
    );
    expect(next.requests.r1).toBe('open');
    expect(next.pendingRequests.r1).toEqual({
      tabId: 9,
      origin: 'https://dapp.example',
      method: 'sign'
    });
  });

  it('windowRequestResponded flips only the status map', () => {
    const opened = reducer(
      empty,
      windowRequestOpened({
        requestId: 'r1',
        tabId: 9,
        origin: 'o',
        method: 'connect'
      })
    );
    const next = reducer(opened, windowRequestResponded({ requestId: 'r1' }));
    expect(next.requests.r1).toBe('responded');
    expect(next.pendingRequests.r1).toEqual({
      tabId: 9,
      origin: 'o',
      method: 'connect'
    });
  });

  it('windowIdCleared nulls only windowId', () => {
    const next = reducer({ ...empty, windowId: 5 }, windowIdCleared());
    expect(next.windowId).toBeNull();
  });
});
