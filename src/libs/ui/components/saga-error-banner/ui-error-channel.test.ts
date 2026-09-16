import {
  clearUiError,
  dismissUiError,
  getUiErrorsServerSnapshot,
  getUiErrorsSnapshot,
  reportUiError,
  subscribeToUiErrors
} from './ui-error-channel';

// A module singleton by design: clean up through the public API, not a test-only reset.
afterEach(() => {
  getUiErrorsSnapshot().forEach(error => dismissUiError(error.id));
});

describe('ui-error-channel', () => {
  it('starts empty', () => {
    expect(getUiErrorsSnapshot()).toEqual([]);
  });

  it('reports an error with its kind and a key built from the detail', () => {
    reportUiError('dispatch-failed', 'OPEN_EXPORT_KEYS_WINDOW_SAGA');

    expect(getUiErrorsSnapshot()).toEqual([
      {
        id: expect.any(Number),
        kind: 'dispatch-failed',
        key: 'dispatch-failed:OPEN_EXPORT_KEYS_WINDOW_SAGA'
      }
    ]);
  });

  it('dedupes repeats of the same key into one row', () => {
    // A service worker restart under three impatient clicks is the normal shape of this.
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');

    expect(getUiErrorsSnapshot()).toHaveLength(1);
  });

  it('keeps different keys apart', () => {
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    reportUiError('window-open-failed', 'ImportAccount');

    expect(getUiErrorsSnapshot().map(error => error.key)).toEqual([
      'dispatch-failed:LOCK_VAULT_SAGA',
      'window-open-failed:ImportAccount'
    ]);
  });

  it('returns a stable snapshot reference until something changes', () => {
    // useSyncExternalStore re-renders forever if getSnapshot returns a fresh array.
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    const first = getUiErrorsSnapshot();

    expect(getUiErrorsSnapshot()).toBe(first);

    reportUiError('window-open-failed', 'ImportAccount');

    expect(getUiErrorsSnapshot()).not.toBe(first);
  });

  it('does not allocate a new snapshot for a deduped repeat', () => {
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    const first = getUiErrorsSnapshot();

    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');

    expect(getUiErrorsSnapshot()).toBe(first);
  });

  it('notifies subscribers on report and on dismiss, and stops after unsubscribe', () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToUiErrors(onChange);

    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    expect(onChange).toHaveBeenCalledTimes(1);

    const [error] = getUiErrorsSnapshot();
    dismissUiError(error.id);
    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does not notify subscribers for a deduped repeat', () => {
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    const onChange = jest.fn();
    const unsubscribe = subscribeToUiErrors(onChange);

    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');

    expect(onChange).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('ignores a dismiss for an id that is not there', () => {
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    const before = getUiErrorsSnapshot();

    dismissUiError(9999);

    expect(getUiErrorsSnapshot()).toBe(before);
  });

  it('reports a key again after it was dismissed', () => {
    // Deliberate: a failure the user acknowledged and then hit again is news.
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');
    dismissUiError(getUiErrorsSnapshot()[0].id);

    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');

    expect(getUiErrorsSnapshot()).toHaveLength(1);
  });

  it('clears the row whose failure has stopped being true', () => {
    reportUiError('dispatch-failed', 'INIT_VAULT_SAGA');
    reportUiError('window-open-failed', 'ImportAccount');

    clearUiError('dispatch-failed', 'INIT_VAULT_SAGA');

    expect(getUiErrorsSnapshot().map(error => error.key)).toEqual([
      'window-open-failed:ImportAccount'
    ]);
  });

  it('notifies subscribers when a row is cleared, and not otherwise', () => {
    reportUiError('dispatch-failed', 'INIT_VAULT_SAGA');
    const onChange = jest.fn();
    const unsubscribe = subscribeToUiErrors(onChange);

    // The success path runs on every dispatch, almost always with nothing to clear.
    const before = getUiErrorsSnapshot();
    clearUiError('dispatch-failed', 'LOCK_VAULT_SAGA');

    expect(onChange).not.toHaveBeenCalled();
    expect(getUiErrorsSnapshot()).toBe(before);

    clearUiError('dispatch-failed', 'INIT_VAULT_SAGA');

    expect(onChange).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('gives the same snapshot to the server renderer', () => {
    // useSyncExternalStore throws "Missing getServerSnapshot" under renderToStaticMarkup.
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');

    expect(getUiErrorsServerSnapshot()).toBe(getUiErrorsSnapshot());
  });
});
