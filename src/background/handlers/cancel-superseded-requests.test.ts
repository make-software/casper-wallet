import { tabs } from 'webextension-polyfill';

import { sdkMethod } from '@content/sdk-method';

import { CANCEL_GRACE_MS } from './cancel-requests';
import { cancelSupersededRequests } from './cancel-superseded-requests';
import { deliverViaOrigin } from './deliver-via-origin';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn() }
}));
jest.mock('./deliver-via-origin', () => ({ deliverViaOrigin: jest.fn() }));

const state = (requests: any, pendingRequests: any) => ({
  windowManagement: { windowId: 1, requests, pendingRequests }
});

const run = (getState: jest.Mock) => {
  const dispatch = jest.fn();
  cancelSupersededRequests({ dispatch, getState } as any);
  return dispatch;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

it('cancels the abandoned request, sends the method-correct Cancel', async () => {
  (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
  const s = state(
    { r1: 'open' },
    { r1: { tabId: 3, origin: 'https://d', method: 'sign' } }
  );
  const dispatch = run(jest.fn().mockReturnValue(s));
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);

  expect(tabs.sendMessage).toHaveBeenCalledWith(
    3,
    sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' })
  );
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: expect.stringContaining('windowRequestResponded')
    })
  );
});

it('never clears windowId (a new window is being tracked)', async () => {
  (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
  const s = state(
    { r1: 'open' },
    { r1: { tabId: 3, origin: 'https://d', method: 'sign' } }
  );
  const dispatch = run(jest.fn().mockReturnValue(s));
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);

  expect(dispatch).not.toHaveBeenCalledWith(
    expect.objectContaining({
      type: expect.stringContaining('windowIdCleared')
    })
  );
});

it('does NOT cancel a request answered during the grace', async () => {
  (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
  const getState = jest
    .fn()
    .mockReturnValueOnce(
      state(
        { r1: 'open' },
        { r1: { tabId: 3, origin: 'https://d', method: 'sign' } }
      )
    )
    // re-snapshot after grace: r1 already answered
    .mockReturnValue(state({ r1: 'responded' }, {}));
  run(getState);
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);

  expect(tabs.sendMessage).not.toHaveBeenCalled();
});

it('falls back to origin delivery and surfaces a cancel-on-supersede error', async () => {
  (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('no tab'));
  (deliverViaOrigin as jest.Mock).mockResolvedValue(1);
  const s = state(
    { r1: 'open' },
    { r1: { tabId: 3, origin: 'https://d', method: 'sign' } }
  );
  const dispatch = run(jest.fn().mockReturnValue(s));
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await Promise.resolve();

  expect(deliverViaOrigin).toHaveBeenCalledWith('https://d', expect.anything());
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      payload: expect.objectContaining({ source: 'cancel-on-supersede' })
    })
  );
});

it('is a no-op when there are no open requests', async () => {
  const dispatch = run(jest.fn().mockReturnValue(state({}, {})));
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  expect(tabs.sendMessage).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
});
