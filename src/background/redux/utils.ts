import { call, select } from 'redux-saga/effects';
import { runtime } from 'webextension-polyfill';

import { RootState } from '@background/redux/store-types';

import { ReduxAction } from './redux-action';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  }
}

export function dispatchToMainStore(action: ReduxAction) {
  return runtime.sendMessage(action).catch((error: unknown) => {
    // A send to a sleeping or restarting MV3 service worker is a routine
    // failure, and some of these actions are load-bearing — the Ledger
    // permission window's attach is what keeps a request alive while the user
    // confirms on the device. Discarding the cause left every one of those
    // indistinguishable from the next. Log the type and the error, NEVER the
    // action: payloads carry vault and signature material.
    // nosemgrep: cw-logging-secrets
    console.error('Dispatch to Main Store failed: ' + action.type, error);
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
