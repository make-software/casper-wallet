import { RootState } from '@background/redux/store-types';

import {
  selectIsWindowBusyWithDevice,
  selectOpenRequest,
  selectOpenRequests,
  selectRequestStatus
} from './selectors';
import { Request } from './types';

// Typed as `Record<string, Request>` (not `any`) so a future shape change to
// `Request` fails this file at build time instead of silently returning `[]`
// / `undefined` at runtime, which is exactly what happened when the mock
// drifted from the flat `{ [id]: status }` + `pendingRequests` shape to this
// discriminated union.
const requests: Record<string, Request> = {
  a: {
    status: 'open',
    tabId: 1,
    origin: 'o',
    method: 'sign',
    windowIds: [7],
    awaitingDeviceConfirmation: false
  },
  b: { status: 'responded' },
  c: { status: 'responded' }
};

const state = {
  windowManagement: {
    windowId: null,
    exportKeysWindowId: null,
    requests
  }
} as unknown as RootState;

it('selectRequestStatus returns the status or undefined', () => {
  expect(selectRequestStatus(state, 'a')).toBe('open');
  expect(selectRequestStatus(state, 'z')).toBeUndefined();
});

it('selectOpenRequests joins open status with its descriptor, including windowIds', () => {
  expect(selectOpenRequests(state)).toEqual([
    {
      requestId: 'a',
      status: 'open',
      tabId: 1,
      origin: 'o',
      method: 'sign',
      windowIds: [7],
      awaitingDeviceConfirmation: false
    }
  ]);
});

it('selectOpenRequest returns the open descriptor with its id', () => {
  expect(selectOpenRequest(state, 'a')).toEqual({
    requestId: 'a',
    status: 'open',
    tabId: 1,
    origin: 'o',
    method: 'sign',
    windowIds: [7],
    awaitingDeviceConfirmation: false
  });
});

it('selectOpenRequest returns undefined for a tombstone or an unknown id', () => {
  expect(selectOpenRequest(state, 'b')).toBeUndefined();
  expect(selectOpenRequest(state, 'z')).toBeUndefined();
});

it('selectOpenRequest does not read an inherited Object.prototype member', () => {
  expect(selectOpenRequest(state, 'toString')).toBeUndefined();
});

describe('selectIsWindowBusyWithDevice', () => {
  const stateWith = (...entries: [string, Request][]) =>
    ({
      windowManagement: {
        windowId: null,
        exportKeysWindowId: null,
        requests: Object.fromEntries(entries)
      }
    }) as unknown as RootState;

  const awaiting = (windowIds: number[]): Request => ({
    status: 'open',
    tabId: 1,
    origin: 'https://dapp.example',
    method: 'sign',
    windowIds,
    awaitingDeviceConfirmation: true
  });

  it('reports the window that displays the awaiting request', () => {
    expect(
      selectIsWindowBusyWithDevice(stateWith(['a', awaiting([7])]), 7)
    ).toBe(true);
  });

  it('leaves an unrelated window free', () => {
    expect(
      selectIsWindowBusyWithDevice(stateWith(['a', awaiting([7])]), 9)
    ).toBe(false);
  });

  // The flag is per request, so the answer must come from `windowIds` and not
  // from "some request somewhere is on the device".
  it('is false while no request awaits the device', () => {
    expect(selectIsWindowBusyWithDevice(state, 7)).toBe(false);
  });

  // A request the permission window still displays has two windows; the shared
  // approval window among them is not the one hosting the device call, but it
  // is still the one a reuse would navigate out from under the flow.
  it('reports every window the awaiting request displays in', () => {
    const busy = stateWith(['a', awaiting([7, 9])]);

    expect(selectIsWindowBusyWithDevice(busy, 7)).toBe(true);
    expect(selectIsWindowBusyWithDevice(busy, 9)).toBe(true);
  });
});
