import { tabs } from 'webextension-polyfill';

import { windowRequestResponded } from '@background/redux/windowManagement/actions';

import { sdkMethod } from '@content/sdk-method';

import { CANCEL_GRACE_MS, cancelRequestsDisplacedBy } from './cancel-requests';
import { deliverViaOrigin } from './deliver-via-origin';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn() }
}));
jest.mock('./deliver-via-origin', () => ({ deliverViaOrigin: jest.fn() }));

const open = (tabId: number, windowIds: number[], method = 'sign') => ({
  status: 'open',
  tabId,
  origin: 'https://dapp',
  method,
  windowIds
});

const state = (requests: any) => ({
  windowManagement: { windowId: 7, exportKeysWindowId: null, requests }
});

const run = async (
  getState: jest.Mock,
  windowId = 7,
  source: 'cancel-on-close' | 'cancel-on-supersede' = 'cancel-on-close'
) => {
  const dispatch = jest.fn();
  const promise = cancelRequestsDisplacedBy(
    { dispatch, getState } as any,
    windowId,
    source
  );
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await promise;
  return dispatch;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
  (deliverViaOrigin as jest.Mock).mockResolvedValue(0);
});
afterEach(() => jest.useRealTimers());

it('cancels a request whose only window went away', async () => {
  const dispatch = await run(
    jest.fn().mockReturnValue(state({ r1: open(3, [7]) }))
  );

  expect(tabs.sendMessage).toHaveBeenCalledWith(
    3,
    sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' })
  );
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: windowRequestResponded({ requestId: 'r1' }).type
    })
  );
});

it('keeps a request alive when a second window still displays it (Ledger)', async () => {
  const dispatch = await run(
    jest.fn().mockReturnValue(state({ r1: open(3, [7, 9]) }))
  );

  expect(tabs.sendMessage).not.toHaveBeenCalled();
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'windowManagement/windowDetachedFromRequests',
      payload: { windowId: 7 }
    })
  );
  expect(dispatch).not.toHaveBeenCalledWith(
    expect.objectContaining({
      type: windowRequestResponded({ requestId: 'r1' }).type
    })
  );
});

it('spares a request that regained a window during the grace', async () => {
  // The Ledger attach crosses a runtime.sendMessage round trip, so it can land
  // AFTER this routine snapshotted its candidates and detached the shared
  // window. By the time the grace elapses the request is genuinely displayed
  // again — cancelling it here is the P0 this whole model exists to prevent.
  const getState = jest
    .fn()
    .mockReturnValueOnce(state({ r1: open(3, [7]) }))
    .mockReturnValue(state({ r1: open(3, [9]) }));

  const dispatch = await run(getState);

  expect(tabs.sendMessage).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalledWith(
    expect.objectContaining({
      type: windowRequestResponded({ requestId: 'r1' }).type
    })
  );
});

it('never cancels a request that never had this window', async () => {
  await run(
    jest.fn().mockReturnValue(state({ r1: open(3, []), r2: open(4, [9]) }))
  );

  expect(tabs.sendMessage).not.toHaveBeenCalled();
});

it('dispatches nothing at all when no open request held the window', async () => {
  // `windows.onRemoved` now fires for ANY window the user closes, not just the
  // tracked approval one. Every dispatch reaches the store subscriber, which
  // does no state-change comparison: a full popupState broadcast to every
  // replica plus a full storage.local rewrite. An unrelated window close must
  // cost nothing.
  const dispatch = await run(
    jest.fn().mockReturnValue(state({ r1: open(3, [9]) }))
  );

  expect(dispatch).not.toHaveBeenCalled();
});

it('sends each cancel to its OWN tab when two requests are displaced', async () => {
  await run(
    jest
      .fn()
      .mockReturnValue(state({ r1: open(3, [7]), r2: open(4, [7], 'connect') }))
  );

  expect(tabs.sendMessage).toHaveBeenCalledWith(
    3,
    sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' })
  );
  expect(tabs.sendMessage).toHaveBeenCalledWith(
    4,
    sdkMethod.connectResponse(false, { requestId: 'r2' })
  );
});

it('does not fire before the grace has fully elapsed', async () => {
  const dispatch = jest.fn();
  const getState = jest.fn().mockReturnValue(state({ r1: open(3, [7]) }));
  const promise = cancelRequestsDisplacedBy(
    { dispatch, getState } as any,
    7,
    'cancel-on-close'
  );

  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS - 1);
  expect(tabs.sendMessage).not.toHaveBeenCalled();

  await jest.advanceTimersByTimeAsync(1);
  await promise;
  expect(tabs.sendMessage).toHaveBeenCalledTimes(1);
});

it('one failing delivery does not abort the other', async () => {
  (tabs.sendMessage as jest.Mock)
    .mockRejectedValueOnce(new Error('tab gone'))
    .mockResolvedValueOnce(undefined);
  (deliverViaOrigin as jest.Mock).mockResolvedValue(0);

  const dispatch = await run(
    jest
      .fn()
      .mockReturnValue(state({ r1: open(3, [7]), r2: open(4, [7], 'connect') }))
  );

  expect(tabs.sendMessage).toHaveBeenCalledTimes(2);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      payload: expect.objectContaining({
        source: 'cancel-on-close',
        message: expect.stringContaining('not delivered')
      })
    })
  );
});

it('stays silent in the UI when a SUPERSEDE recovered via the page origin', async () => {
  // Only on this path is the user already looking at the next approval screen,
  // so a "recovered anyway" banner would be noise on top of a signing prompt.
  (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('tab gone'));
  (deliverViaOrigin as jest.Mock).mockResolvedValue(1);

  const dispatch = await run(
    jest.fn().mockReturnValue(state({ r1: open(3, [7]) })),
    7,
    'cancel-on-supersede'
  );

  expect(deliverViaOrigin).toHaveBeenCalledWith(
    'https://dapp',
    expect.anything()
  );
  expect(dispatch).not.toHaveBeenCalledWith(
    expect.objectContaining({ type: 'appEvents/sagaError' })
  );
});

it('still surfaces a banner on the CLOSE path even when the fallback delivered', async () => {
  // `cancelRequests` is shared, but the supersede rationale is not: after a
  // window close there is no replacement screen, and `deliverViaOrigin` only
  // counts same-origin sends to active tabs that did not throw — that is not
  // proof the tab holding the dapp's pending promise received anything.
  (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('tab gone'));
  (deliverViaOrigin as jest.Mock).mockResolvedValue(1);

  const dispatch = await run(
    jest.fn().mockReturnValue(state({ r1: open(3, [7]) })),
    7,
    'cancel-on-close'
  );

  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'appEvents/sagaError',
      payload: expect.objectContaining({
        source: 'cancel-on-close',
        // The TEXT, not just the source: `saga-error-banner.tsx` renders the
        // message verbatim, and the two arms of this ternary say opposite
        // things about whether the dapp was told. Collapsing it to the
        // pessimistic constant must fail here.
        message: expect.stringContaining('recovered via the page')
      })
    })
  );
});
