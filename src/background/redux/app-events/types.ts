/**
 * Every producer of a `sagaError`, enumerated. Previously `source` was a bare
 * `string`, so nothing tied the value a producer writes to the value a reader
 * expects: a typo, a renamed module or a new producer that invents its own
 * spelling all compiled clean. It is also what the request-lifecycle code
 * needs, since one of these values decides whether a cancel banner is
 * suppressed (see `CancelSource`).
 */
export type SagaErrorSource =
  // redux-saga failures
  | 'resetVaultSaga'
  | 'initKeysSage'
  | 'initVaultSaga'
  | 'recoverVaultSaga'
  | 'checkCasper2NetworkSaga'
  | 'lockVaultSaga'
  | 'unlockVaultSaga'
  | 'timeoutCounterSaga'
  | 'updateVaultCipher'
  | 'reconcileStalePayloadsSaga'
  | 'createAccountSaga'
  | 'openExportKeysWindowSaga'
  | 'changePasswordSaga'
  // approval-request lifecycle failures
  | 'cancel-on-close'
  | 'cancel-on-supersede'
  | 'open-window-failed'
  | 'sdk-response-to-tab'
  // Startup sweep of a hydrated 'open' row no window still claims (spec
  // §8.1) — a second, console-only trigger for `failRequestOnWindowError`.
  | 'sweep-orphaned-requests';

export interface SagaError {
  id: number;
  source: SagaErrorSource;
  message: string;
  code?: string;
}

export interface AppEventsState {
  dismissedEventIds: number[];
  errors: SagaError[];
  nextErrorId: number;
}
