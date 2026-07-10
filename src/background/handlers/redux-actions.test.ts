import { dismissSagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';

import { handleReduxAction } from './redux-actions';

// `redux-actions.ts` transitively imports `open-onboarding-flow.ts`, which
// touches `webextension-polyfill` at module load time. Stub it so the module
// can load outside a browser extension context (same approach as
// `sdk-response-to-tab.test.ts`).
jest.mock('webextension-polyfill', () => ({
  action: undefined,
  browserAction: undefined,
  storage: { local: { remove: jest.fn(), get: jest.fn(), set: jest.fn() } },
  tabs: { get: jest.fn(), update: jest.fn(), create: jest.fn() },
  windows: { update: jest.fn() }
}));

// Build a minimal fake store with a spied dispatch — modeled on
// `sdk-response-to-tab.test.ts`'s `makeStore`.
function makeStore() {
  const dispatch = jest.fn();
  const store = {
    getState: () => ({}),
    dispatch
  } as unknown as MainStore;
  return { store, dispatch };
}

describe('handleReduxAction (background router — UI-originated action forwarding)', () => {
  it('dismissSagaError → forwarded to the store (dismiss button must work)', async () => {
    const { store, dispatch } = makeStore();
    const action = dismissSagaError(1);

    const result = await handleReduxAction(action, store);

    expect(result).toEqual({ handled: true, response: undefined });
    expect(dispatch).toHaveBeenCalledWith(action);
  });

  it('unknown action type → { handled: false } (allowlist mechanism still gates unrecognized actions)', async () => {
    const { store, dispatch } = makeStore();

    const result = await handleReduxAction(
      { type: 'totally/unknown/action' },
      store
    );

    expect(result).toEqual({ handled: false });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
