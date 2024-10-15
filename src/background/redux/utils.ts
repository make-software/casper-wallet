import { call, select } from 'redux-saga/effects';
import { RootState } from 'typesafe-actions';
import { runtime } from 'webextension-polyfill';

import { ReduxAction } from './redux-action';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  }
}

export function dispatchToMainStore(action: ReduxAction) {
  return runtime.sendMessage(action).catch(() => {
    console.error('Dispatch to Main Store: ' + action.type);
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
