import { selectOpenRequests, selectRequestStatus } from './selectors';

const state = {
  windowManagement: {
    windowId: null,
    requests: { a: 'open', b: 'responded', c: 'closed' },
    pendingRequests: {
      a: { tabId: 1, origin: 'o', method: 'sign' },
      b: { tabId: 2, origin: 'o', method: 'connect' },
      c: { tabId: 3, origin: 'o', method: 'decryptMessage' }
    }
  }
} as any;

it('selectRequestStatus returns the status or undefined', () => {
  expect(selectRequestStatus(state, 'a')).toBe('open');
  expect(selectRequestStatus(state, 'z')).toBeUndefined();
});

it('selectOpenRequests joins open status with its descriptor', () => {
  expect(selectOpenRequests(state)).toEqual([
    { requestId: 'a', tabId: 1, origin: 'o', method: 'sign' }
  ]);
});
