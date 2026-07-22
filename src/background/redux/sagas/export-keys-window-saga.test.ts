import * as matchers from 'redux-saga-test-plan/matchers';
import { expectSaga } from 'redux-saga-test-plan';
import { windows } from 'webextension-polyfill';

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

describe('openExportKeysWindowSaga', () => {
  const currentWindow = {
    id: 1,
    state: 'normal',
    width: 1200,
    left: 0,
    top: 0
  };

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
        .not.put(exportKeysWindowIdChanged(expect.any(Number)))
        .run()
    );
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

  it('does not track when the created window has no id', () => {
    return expectSaga(openExportKeysWindowSaga)
      .withState({ windowManagement: { exportKeysWindowId: null } })
      .provide([
        [matchers.call.fn(windows.getCurrent), currentWindow],
        [matchers.call.fn(windows.create), {}]
      ])
      .not.put(exportKeysWindowIdChanged(expect.any(Number)))
      .run();
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
