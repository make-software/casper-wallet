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
// send failed. NEVER rejects: ~105 call sites do not catch, so a rejection here
// would become an unhandled rejection at each of them.
export function dispatchToMainStore(action: ReduxAction): Promise<boolean> {
  // `sendMessage` is called inside a `then` so a SYNCHRONOUS throw lands in the
  // same handler as a rejection. `Extension context invalidated` has that shape,
  // and four app entries dispatch from a render body that sits ABOVE the
  // ErrorBoundary (`popup/index.tsx:56` and three siblings) — there an escaping
  // throw blanks the whole page instead of resolving `false`.
  return Promise.resolve()
    .then(() => runtime.sendMessage(action))
    .then(() => {
      // The row this action may have left behind describes a failure that has
      // just stopped being true.
      clearUiError('dispatch-failed', action.type);
      return true;
    })
    .catch((error: unknown) => {
      // A send to a sleeping or restarting MV3 service worker is a routine
      // failure, and some of these actions are load-bearing — the Ledger
      // permission window's attach is what keeps a request alive while the user
      // confirms on the device. Discarding the cause left every one of those
      // indistinguishable from the next. Log the type and the error, NEVER the
      // action: payloads carry vault and signature material.
      // nosemgrep: cw-logging-secrets
      console.error('Dispatch to Main Store failed: ' + action.type, error);

      // The background store is what is unreachable, so `sagaError` cannot be
      // dispatched from here — the surface has to be UI-local.
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
