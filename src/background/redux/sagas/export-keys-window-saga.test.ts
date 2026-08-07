import * as matchers from 'redux-saga-test-plan/matchers';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import { windows } from 'webextension-polyfill';

import {
  dismissSagaErrorsBySource,
  sagaError
} from '@background/redux/app-events/actions';
import {
  exportKeysWindowIdChanged,
  exportKeysWindowIdCleared
} from '@background/redux/windowManagement/actions';

import { openExportKeysWindow } from './actions';
import {
  exportKeysWindowSaga,
  openExportKeysWindowSaga
} from './export-keys-window-saga';

jest.mock('webextension-polyfill', () => ({
  windows: {
    getAll: jest.fn(),
    getCurrent: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  }
}));

interface RecordedEffect {
  type: string;
  payload?: { action?: { type?: string } };
}

// `.put(...)` is a containment check — it removes one matching effect from the
// recorded set and passes, so a second, identical dispatch goes unnoticed.
// Counting is what pins "exactly one", and it reads `allEffects` rather than
// `effects` precisely because the former is not consumed by the assertions.
const countPutsOfType = (allEffects: unknown, type: string) =>
  (allEffects as RecordedEffect[]).filter(
    effect => effect.type === 'PUT' && effect.payload?.action?.type === type
  ).length;

describe('openExportKeysWindowSaga', () => {
  const currentWindow = {
    id: 1,
    state: 'normal',
    width: 1200,
    left: 0,
    top: 0
  };

  it('retracts what a previous attempt reported before re-attempting', () => {
    return expectSaga(openExportKeysWindowSaga)
      .withState({ windowManagement: { exportKeysWindowId: null } })
      .provide([
        [matchers.call.fn(windows.getCurrent), currentWindow],
        [matchers.call.fn(windows.create), { id: 77 }]
      ])
      .put(dismissSagaErrorsBySource('openExportKeysWindowSaga'))
      .run();
  });

  it('refocuses an existing export popup window and does not create', () => {
    return (
      expectSaga(openExportKeysWindowSaga)
        .withState({ windowManagement: { exportKeysWindowId: 42 } })
        .provide([
          [matchers.call.fn(windows.getAll), [{ id: 42, type: 'popup' }]],
          [matchers.call.fn(windows.update), undefined]
        ])
        .call.fn(windows.update)
        // Guards the early `return` after the reuse hit: without it, execution
        // falls through into windows.getCurrent()/windows.create() and the
        // failure is swallowed by the catch block, so this test would still
        // pass on the assertions above alone.
        .not.call.fn(windows.getCurrent)
        .not.call.fn(windows.create)
        // Asserted on the action type, not on a built action: expectSaga
        // compares effects with lodash.isEqual, which never matches jest's
        // asymmetric matchers — `.not.put(action(expect.any(Number)))` would be
        // satisfied unconditionally and guarantee nothing.
        .not.put.actionType(exportKeysWindowIdChanged.type)
        .not.put.actionType(sagaError.type)
        .run()
    );
  });

  it('reports a failed refocus as a focus failure and still does not create', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const { allEffects } = await expectSaga(openExportKeysWindowSaga)
        .withState({ windowManagement: { exportKeysWindowId: 42 } })
        .provide([
          [matchers.call.fn(windows.getAll), [{ id: 42, type: 'popup' }]],
          [matchers.call.fn(windows.update), throwError(new Error('denied'))]
        ])
        .put(
          sagaError({
            source: 'openExportKeysWindowSaga',
            // The window was found by getAll, so it is on screen: the generic
            // "could not open" message of the outer catch would contradict it.
            message: 'Could not focus the export window'
          })
        )
        // Opening a second export window alongside the existing one would be
        // worse than the failure being reported.
        .not.call.fn(windows.getCurrent)
        .not.call.fn(windows.create)
        // The window still exists; background/index.ts clears the tracked id on
        // windows.onRemoved, so the saga must not clear it here.
        .not.put.actionType(exportKeysWindowIdCleared.type)
        .run();

      expect(countPutsOfType(allEffects, sagaError.type)).toBe(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('clears a stale id and creates a new window', () => {
    return expectSaga(openExportKeysWindowSaga)
      .withState({ windowManagement: { exportKeysWindowId: 42 } })
      .provide([
        [matchers.call.fn(windows.getAll), []],
        [matchers.call.fn(windows.getCurrent), currentWindow],
        [matchers.call.fn(windows.create), { id: 99 }]
      ])
      .put(exportKeysWindowIdCleared())
      .put(exportKeysWindowIdChanged(99))
      .run();
  });

  it('creates and tracks a new window when none is tracked', () => {
    return expectSaga(openExportKeysWindowSaga)
      .withState({ windowManagement: { exportKeysWindowId: null } })
      .provide([
        [matchers.call.fn(windows.getCurrent), currentWindow],
        [matchers.call.fn(windows.create), { id: 77 }]
      ])
      .put(exportKeysWindowIdChanged(77))
      .run();
  });

  it('reports a created window that cannot be tracked', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const { allEffects } = await expectSaga(openExportKeysWindowSaga)
        .withState({ windowManagement: { exportKeysWindowId: null } })
        .provide([
          [matchers.call.fn(windows.getCurrent), currentWindow],
          [matchers.call.fn(windows.create), {}]
        ])
        .put(
          sagaError({
            source: 'openExportKeysWindowSaga',
            message:
              'Could not track the export window; close it before opening another'
          })
        )
        .not.put.actionType(exportKeysWindowIdChanged.type)
        // Nothing was tracked, so there is nothing to clear: the new branch
        // must not invent state.
        .not.put.actionType(exportKeysWindowIdCleared.type)
        .run();

      expect(countPutsOfType(allEffects, sagaError.type)).toBe(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('surfaces a saga error when the export window cannot be opened', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const { allEffects } = await expectSaga(openExportKeysWindowSaga)
        .withState({ windowManagement: { exportKeysWindowId: null } })
        .provide([
          [matchers.call.fn(windows.getCurrent), currentWindow],
          // throwError throws at the effect site. A literal
          // Promise.reject(...) here is built when the provider array is
          // evaluated, before .run(), and nothing attaches a handler until the
          // windows.create yield is reached — safe only while no macrotask
          // boundary precedes it, and an unhandledRejection the moment one does.
          [matchers.call.fn(windows.create), throwError(new Error('denied'))]
        ])
        .put(
          sagaError({
            source: 'openExportKeysWindowSaga',
            message: 'Could not open the export window'
          })
        )
        .not.put.actionType(exportKeysWindowIdChanged.type)
        .run();

      expect(countPutsOfType(allEffects, sagaError.type)).toBe(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  describe('exportKeysWindowSaga (watcher)', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('takeLeading runs the open worker only once for two overlapping dispatches', async () => {
      // No .provide() here: the mocked windows.* fns must actually be invoked
      // (not short-circuited by a provider) so call counts are meaningful, and
      // windows.getCurrent stays pending so the second dispatch genuinely
      // overlaps the first worker's in-flight run instead of arriving after
      // it settles.
      let resolveGetCurrent: (value: typeof currentWindow) => void = () => {};
      (windows.getCurrent as jest.Mock).mockReturnValue(
        new Promise(resolve => {
          resolveGetCurrent = resolve;
        })
      );
      (windows.create as jest.Mock).mockResolvedValue({ id: 77 });

      const saga = expectSaga(exportKeysWindowSaga).withState({
        windowManagement: { exportKeysWindowId: null }
      });

      saga.dispatch(openExportKeysWindow());
      const runPromise = saga.run(200);

      // Flush microtasks so the first dispatch is delivered and the worker
      // parks on the pending windows.getCurrent() call before the second,
      // overlapping dispatch fires.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      saga.dispatch(openExportKeysWindow());

      await Promise.resolve();
      await Promise.resolve();

      resolveGetCurrent(currentWindow);

      await runPromise;

      expect(windows.getCurrent).toHaveBeenCalledTimes(1);
      expect(windows.create).toHaveBeenCalledTimes(1);
    });
  });
});
