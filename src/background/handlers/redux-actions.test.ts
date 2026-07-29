import { windows } from 'webextension-polyfill';

import { backgroundEvent } from '@background/background-events';
import { enableOnboardingFlow } from '@background/open-onboarding-flow';
import { dismissSagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';
import { lockVault, resetVault } from '@background/redux/sagas/actions';
import { accountRenamed } from '@background/redux/vault/actions';
import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

import { handleReduxAction } from './redux-actions';

// enableOnboardingFlow touches webextension-polyfill; stub it and assert it runs.
jest.mock('@background/open-onboarding-flow', () => ({
  enableOnboardingFlow: jest.fn().mockResolvedValue(undefined)
}));
// attach-window-to-request reaches for `windows` directly. Stub the module so
// the dedicated attach branch can be exercised without a browser.
jest.mock('webextension-polyfill', () => ({
  windows: { get: jest.fn().mockResolvedValue({ id: 7 }) }
}));

const enableOnboardingFlowMock = enableOnboardingFlow as jest.MockedFunction<
  typeof enableOnboardingFlow
>;

function makeStore() {
  const dispatch = jest.fn();
  const store = { dispatch } as unknown as MainStore;
  return { store, dispatch };
}

beforeEach(() => enableOnboardingFlowMock.mockClear());

describe('handleReduxAction forwarding gate (fail-closed)', () => {
  it('resetVault → dispatches and re-enables the onboarding flow', async () => {
    const { store, dispatch } = makeStore();
    const action = { type: resetVault.type };

    const result = await handleReduxAction(action, store);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(action);
    expect(enableOnboardingFlowMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('windowRequestWindowAttached → handled by its own branch, which verifies the window', async () => {
    // It must reach the store (the Ledger hook dispatches it from a UI page),
    // but through the branch that probes the window rather than through the
    // blind forwarding set — a dead or invented windowId would otherwise make
    // the request permanently uncancellable.
    const { store, dispatch } = makeStore();
    const action = windowRequestWindowAttached({
      requestId: 'r1',
      windowId: 7
    });

    const result = await handleReduxAction(action, store);

    expect(dispatch).toHaveBeenCalledWith(action);
    expect(windows.get).toHaveBeenCalledWith(7);
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('a FORWARDED action type → dispatched to the real store', async () => {
    const { store, dispatch } = makeStore();
    const action = lockVault(); // type is in FORWARDED_ACTION_TYPES

    const result = await handleReduxAction(action, store);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(action);
    expect(enableOnboardingFlowMock).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('another FORWARDED type (payload-carrying) → dispatched verbatim', async () => {
    const { store, dispatch } = makeStore();
    const action = accountRenamed({ name: 'a', newName: 'b' } as any);

    const result = await handleReduxAction(action, store);

    expect(dispatch).toHaveBeenCalledWith(action);
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('dismissSagaError → forwarded to the store (dismiss button must work)', async () => {
    const { store, dispatch } = makeStore();
    const action = dismissSagaError(1);

    const result = await handleReduxAction(action, store);

    expect(dispatch).toHaveBeenCalledWith(action);
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('backgroundEvent.popupStateUpdated → handled but NEVER dispatched or responded', async () => {
    const { store, dispatch } = makeStore();
    const action = backgroundEvent.popupStateUpdated({} as any);

    const result = await handleReduxAction(action, store);

    expect(dispatch).not.toHaveBeenCalled();
    // handled:true with no response — promise stays pending on purpose
    expect(result).toEqual({ handled: true });
    expect(result).not.toHaveProperty('response');
  });

  it('unknown / non-forwarded action type → { handled: false }, NOT dispatched (fail-closed)', async () => {
    const { store, dispatch } = makeStore();

    const result = await handleReduxAction(
      { type: 'SOME_ARBITRARY_UNLISTED_ACTION' },
      store
    );

    expect(dispatch).not.toHaveBeenCalled();
    expect(enableOnboardingFlowMock).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: false });
  });
});
