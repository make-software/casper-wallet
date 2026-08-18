// Errors that never reach the background store, and so can never arrive as a
// `sagaError`: the transport to the background is the thing that failed. The
// replica store cannot hold them either — `createMainStoreReplica(state)` runs
// in the render body of every app's `Tree`, so a local dispatch is discarded on
// the next broadcast. Hence a module store the banner reads directly.
export type UiErrorKind = 'dispatch-failed' | 'window-open-failed';

export interface UiError {
  id: number;
  kind: UiErrorKind;
  key: string;
}

let errors: UiError[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(listener => listener());
}

// Carries a `kind`, not a message: the callers (`dispatchToMainStore`, the
// window-manager hook) are plain functions with no access to `t()`. The banner
// owns the copy.
export function reportUiError(kind: UiErrorKind, detail: string) {
  const key = `${kind}:${detail}`;

  if (errors.some(error => error.key === key)) {
    return;
  }

  errors = [...errors, { id: nextId++, kind, key }];
  emit();
}

// The counterpart of `reportUiError`, called from the same callers' success
// paths. Without it a row outlives the failure it describes: the guards keep the
// user on the page to retry, and the retry that works renders the success screen
// under a banner still saying the wallet didn't respond — the key dedupe means it
// would not even be refreshed, just left.
export function clearUiError(kind: UiErrorKind, detail: string) {
  const key = `${kind}:${detail}`;

  if (!errors.some(error => error.key === key)) {
    return;
  }

  errors = errors.filter(error => error.key !== key);
  emit();
}

export function dismissUiError(id: number) {
  const next = errors.filter(error => error.id !== id);

  if (next.length === errors.length) {
    return;
  }

  errors = next;
  emit();
}

export function subscribeToUiErrors(onChange: () => void) {
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
  };
}

// Both must return a reference that only changes when the list does, or
// `useSyncExternalStore` re-renders on every check.
export function getUiErrorsSnapshot() {
  return errors;
}

export function getUiErrorsServerSnapshot() {
  return errors;
}
