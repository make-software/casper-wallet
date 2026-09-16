import { call, select } from 'redux-saga/effects';
import { runtime } from 'webextension-polyfill';

import { RootState } from '@background/redux/store-types';

import {
  clearUiError,
  reportUiError
} from '@libs/ui/components/saga-error-banner/ui-error-channel';

import { ReduxAction } from './redux-action';
import { SURFACED_DISPATCH_ACTIONS } from './surfaced-dispatch-actions';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  }
}

// Resolves `true` when the background acknowledged the action, `false` when the
// send failed. NEVER rejects: ~105 call sites do not catch.
export function dispatchToMainStore(action: ReduxAction): Promise<boolean> {
  // `sendMessage` runs inside a `then` so a SYNCHRONOUS throw (`Extension
  // context invalidated`) lands in the same handler as a rejection.
  return Promise.resolve()
    .then(() => runtime.sendMessage(action))
    .then(() => {
      clearUiError('dispatch-failed', action.type);
      return true;
    })
    .catch((error: unknown) => {
      // The type and the error, NEVER the action: payloads carry key material.
      // nosemgrep: cw-logging-secrets
      console.error('Dispatch to Main Store failed: ' + action.type, error);

      // The background store is what is unreachable, so the surface has to be
      // UI-local rather than a dispatched `sagaError`.
      if (SURFACED_DISPATCH_ACTIONS.has(action.type)) {
        reportUiError('dispatch-failed', action.type);
      }

      return false;
    });
}

export function* sagaSelect<Result>(selector: (state: RootState) => Result) {
  const res: Result = yield select(selector);
  return res;
}

export function* sagaCall<Result, Args extends any[]>(
  fn: (...args: Args) => Promise<Result>,
  ...args: Args
) {
  const res: Result = yield call(fn, ...args) as Result;
  return res;
}
