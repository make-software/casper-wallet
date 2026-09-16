// Errors that can never arrive as a `sagaError` — the transport to the background is
// what failed — and that the replica store discards on the next broadcast.
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

// Carries a `kind`, not a message: the callers cannot reach `t()`, so the banner owns the copy.
export function reportUiError(kind: UiErrorKind, detail: string) {
  const key = `${kind}:${detail}`;

  if (errors.some(error => error.key === key)) {
    return;
  }

  errors = [...errors, { id: nextId++, kind, key }];
  emit();
}

// Without this, a row outlives the failure it describes: the key dedupe never refreshes it.
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
