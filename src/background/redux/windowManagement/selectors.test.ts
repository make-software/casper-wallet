import { RootState } from '@background/redux/store-types';

import {
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
  a: { status: 'open', tabId: 1, origin: 'o', method: 'sign', windowIds: [7] },
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
      windowIds: [7]
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
    windowIds: [7]
  });
});

it('selectOpenRequest returns undefined for a tombstone or an unknown id', () => {
  expect(selectOpenRequest(state, 'b')).toBeUndefined();
  expect(selectOpenRequest(state, 'z')).toBeUndefined();
});

it('selectOpenRequest does not read an inherited Object.prototype member', () => {
  expect(selectOpenRequest(state, 'toString')).toBeUndefined();
});
