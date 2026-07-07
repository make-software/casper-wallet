import {
  connectWindowInit,
  importWindowInit,
  onboardingAppInit,
  popupWindowInit,
  signWindowInit,
  windowIdChanged,
  windowIdCleared
} from './actions';
import { reducer } from './reducer';

describe('windowManagement reducer', () => {
  it('has null windowId initially', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual({
      windowId: null
    });
  });
  it('sets and clears windowId', () => {
    const s = reducer({ windowId: null }, windowIdChanged(7));
    expect(s).toEqual({ windowId: 7 });
    expect(reducer(s, windowIdCleared())).toEqual({ windowId: null });
  });
  it('window-init actions do not change state', () => {
    const state = { windowId: 7 };
    expect(reducer(state, onboardingAppInit())).toEqual({ windowId: 7 });
    expect(reducer(state, popupWindowInit())).toEqual({ windowId: 7 });
    expect(reducer(state, connectWindowInit())).toEqual({ windowId: 7 });
    expect(reducer(state, importWindowInit())).toEqual({ windowId: 7 });
    expect(reducer(state, signWindowInit())).toEqual({ windowId: 7 });
  });
});
