import * as matchers from 'redux-saga-test-plan/matchers';
import { expectSaga } from 'redux-saga-test-plan';
import { dynamic, throwError } from 'redux-saga-test-plan/providers';
import { CallEffectDescriptor } from 'redux-saga/effects';
import { windows } from 'webextension-polyfill';

import {
  dismissSagaErrorsBySource,
  sagaError
} from '@background/redux/app-events/actions';
import {
  exportKeysWindowIdChanged,
  exportKeysWindowIdCleared
} from '@background/redux/windowManagement/actions';
import { selectExportKeysWindowId } from '@background/redux/windowManagement/selectors';

import { openExportKeysWindow } from './actions';
import {
  WINDOWS_API_TIMEOUT_MS,
  exportKeysWindowSaga,
  openExportKeysWindowSaga
} from './export-keys-window-saga';

jest.mock('webextension-polyfill', () => ({
  windows: {
    getAll: jest.fn(),
    getCurrent: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    remove: jest.fn()
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
  // The worker is spawned detached, so a test that abandons one leaks its real
  // windows.* invocations into whatever runs next. Counts must start at zero.
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

      // Exactly one argument. The saga deliberately does not log `created`:
      // a Windows.Window can carry tabs[].url, which here is the
      // download-account-keys route. Nothing else in the tree pins that
      // redaction, so a later "improvement" to console.error(msg, created)
      // would otherwise ship green.
      expect(consoleError).toHaveBeenCalledWith(
        'openExportKeysWindowSaga: the export window resolved without an id'
      );
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

  it('closes a window that arrives after another one was already tracked', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      // Three selects run in this flow: the reuse guard, the pre-create
      // snapshot, and the post-create re-read. Only the last one sees a
      // tracked id — i.e. the retry the timeout banner invited won the race
      // while this create was still in flight.
      let selects = 0;
      const trackedByTheRetry = 55;

      const { allEffects } = await expectSaga(openExportKeysWindowSaga)
        .withState({ windowManagement: { exportKeysWindowId: null } })
        .provide([
          [
            matchers.select.selector(selectExportKeysWindowId),
            dynamic(() => (selects++ < 2 ? null : trackedByTheRetry))
          ],
          [matchers.call.fn(windows.getCurrent), currentWindow],
          [matchers.call.fn(windows.create), { id: 99 }],
          [matchers.call.fn(windows.remove), undefined]
        ])
        // Overwriting the tracked id would strand the retry's window instead —
        // two windows rendering key material is exactly what 1391 is about.
        .not.put.actionType(exportKeysWindowIdChanged.type)
        .call([windows, windows.remove], 99)
        .run();

      expect(countPutsOfType(allEffects, sagaError.type)).toBe(0);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('closes a window that arrives after a hang in getCurrent, not only in create', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      // The sibling test above hangs in `create`, so the retry lands BETWEEN the
      // pre-create snapshot and the post-create re-read. Here the hang is one
      // call earlier — in `getCurrent` — so the retry lands BEFORE the snapshot
      // too. That ordering is what makes the position of the snapshot, rather
      // than the comparison itself, the thing under test: read it downstream of
      // the hang and it already holds the retry's id, so `trackedNow !==
      // trackedBeforeCreate` is false exactly when a straggler must be caught.
      let trackedId: number | null = null;
      const trackedByTheRetry = 99;
      const arrivedLate = 100;

      const { allEffects } = await expectSaga(openExportKeysWindowSaga)
        .withState({ windowManagement: { exportKeysWindowId: null } })
        .provide([
          [
            matchers.select.selector(selectExportKeysWindowId),
            dynamic(() => trackedId)
          ],
          [
            matchers.call.fn(windows.getCurrent),
            dynamic(() => {
              // While this worker was parked here, the entry saga's bound fired,
              // the banner invited a retry, and that retry ran to completion.
              trackedId = trackedByTheRetry;

              return currentWindow;
            })
          ],
          [matchers.call.fn(windows.create), { id: arrivedLate }],
          [matchers.call.fn(windows.remove), undefined]
        ])
        // Tracking the late window would strand window 99 — the one the user is
        // actually looking at — with no id in the store to focus or close it by.
        .not.put.actionType(exportKeysWindowIdChanged.type)
        .call([windows, windows.remove], arrivedLate)
        .run();

      expect(countPutsOfType(allEffects, sagaError.type)).toBe(0);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('bounds a hung windows.* call and leaves the menu item usable', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const delaysRequested: unknown[] = [];

    try {
      // The hang the bound exists for: windows.getCurrent never settles.
      (windows.getCurrent as jest.Mock).mockReturnValue(new Promise(() => {}));

      // Only redux-saga's own delay is short-circuited, so the real race runs
      // against the real WINDOWS_API_TIMEOUT_MS. A static `race` provider would
      // be shape-blind — it replaces the whole effect, the worker is never
      // entered, and the bound under test is never exercised.
      const saga = expectSaga(exportKeysWindowSaga)
        .withState({ windowManagement: { exportKeysWindowId: null } })
        .provide({
          call: (
            effect: CallEffectDescriptor<unknown>,
            next: () => unknown
          ) => {
            if (effect.fn?.name !== 'delayP') return next();

            delaysRequested.push(effect.args[0]);

            return true;
          }
        });

      saga.dispatch(openExportKeysWindow());
      const runPromise = saga.silentRun(100);

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // The wedged first attempt must not swallow this one — that inert menu
      // item is the whole point of the ticket's timeout item.
      saga.dispatch(openExportKeysWindow());

      const { allEffects } = await runPromise;

      expect(windows.getCurrent).toHaveBeenCalledTimes(2);
      // Literal on purpose. Asserting against the imported constant is a
      // tautology — both sides move together, and dropping the bound to 50ms
      // sails straight through. 5000 is a product-visible wait; changing it
      // should have to change this line too.
      expect(delaysRequested).toEqual([5000, 5000]);
      expect(WINDOWS_API_TIMEOUT_MS).toBe(5000);
      expect(countPutsOfType(allEffects, sagaError.type)).toBe(2);
      expect(countPutsOfType(allEffects, dismissSagaErrorsBySource.type)).toBe(
        2
      );
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
