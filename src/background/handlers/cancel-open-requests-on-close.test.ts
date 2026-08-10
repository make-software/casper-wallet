import { tabs } from 'webextension-polyfill';

import { windowIdCleared } from '@background/redux/windowManagement/actions';
import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { sdkMethod } from '@content/sdk-method';

import { cancelOpenRequestsForClosedWindow } from './cancel-open-requests-on-close';
import { CANCEL_GRACE_MS } from './cancel-requests';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn() }
}));
jest.mock('@background/utils', () => ({
  emitSdkEventToActiveTabsWithOrigin: jest.fn()
}));

const open = (tabId: number, windowIds: number[], method = 'sign') => ({
  status: 'open',
  tabId,
  origin: 'https://dapp',
  method,
  windowIds
});
const state = (windowId: number | null, requests: any) => ({
  windowManagement: { windowId, exportKeysWindowId: null, requests }
});
const cleared = () => expect.objectContaining({ type: windowIdCleared().type });

const run = async (getState: jest.Mock) => {
  const dispatch = jest.fn();
  const promise = cancelOpenRequestsForClosedWindow(
    { dispatch, getState } as any,
    7
  );
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await promise;
  return dispatch;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
  (emitSdkEventToActiveTabsWithOrigin as jest.Mock).mockResolvedValue(0);
});
afterEach(() => jest.useRealTimers());

describe('cancelOpenRequestsForClosedWindow', () => {
  it('still open after grace → cancels, marks responded, clears windowId', async () => {
    const dispatch = await run(
      jest.fn().mockReturnValue(state(7, { r1: open(3, [7]) }))
    );

    expect(tabs.sendMessage).toHaveBeenCalledWith(
      3,
      sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' })
    );
    expect(dispatch).toHaveBeenCalledWith(cleared());
  });

  it('Ledger window still displays the request → NOT cancelled', async () => {
    const dispatch = await run(
      jest.fn().mockReturnValue(state(7, { r1: open(3, [7, 9]) }))
    );

    expect(tabs.sendMessage).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(cleared());
  });

  it('genuine response arrives during the grace → not cancelled', async () => {
    const getState = jest
      .fn()
      .mockReturnValueOnce(state(7, { r1: open(3, [7]) }))
      .mockReturnValue(state(7, { r1: { status: 'responded' } }));

    await run(getState);

    expect(tabs.sendMessage).not.toHaveBeenCalled();
  });

  it('a new window took over during the grace → windowId not cleared', async () => {
    const getState = jest
      .fn()
      .mockReturnValueOnce(state(7, { r1: open(3, [7]) }))
      .mockReturnValue(state(99, { r1: open(3, [7]) }));

    const dispatch = await run(getState);

    expect(dispatch).not.toHaveBeenCalledWith(cleared());
  });

  it('an untracked window closed → no cancel, windowId untouched', async () => {
    const dispatch = await run(
      jest.fn().mockReturnValue(state(42, { r1: open(3, [42]) }))
    );

    expect(tabs.sendMessage).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalledWith(cleared());
  });
});
