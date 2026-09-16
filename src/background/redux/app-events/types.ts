/**
 * Every producer of a `sagaError`, enumerated. One of these values decides
 * whether a cancel banner is suppressed (see `CancelSource`).
 */
export type SagaErrorSource =
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
  | 'cancel-on-close'
  | 'cancel-on-supersede'
  | 'open-window-failed'
  | 'sdk-response-to-tab'
  // Startup sweep of a hydrated 'open' row no window still claims: a second,
  // console-only trigger for `failRequestOnWindowError`.
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
