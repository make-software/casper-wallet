import { compose } from 'redux';
import { composeWithDevTools } from 'remote-redux-devtools';
import browser from 'webextension-polyfill';

import { createStore } from '@src/background/redux';
import {
  backgroundEvent,
  PopupState,
  selectPopupState
} from '@src/background/background-events';

import { ReduxAction } from './redux-action';
import { RootState } from 'typesafe-actions';
import { select, call } from 'redux-saga/effects';
import { startApp } from './vault/actions';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  }
}

// export const composeEnhancers = compose;
export const composeEnhancers =
  process.env.NODE_ENV === 'development'
    ? composeWithDevTools({
        name: 'Casper Wallet',
        hostname: 'localhost',
        port: 8000
      })
    : compose;

export const REDUX_STORAGE_KEY = 'redux-storage';

// this needs to be private
let storeSingleton: ReturnType<typeof createStore>;

export async function getMainStoreSingleton() {
  const { [REDUX_STORAGE_KEY]: state } = await browser.storage.local.get([
    REDUX_STORAGE_KEY
  ]);

  if (storeSingleton == null) {
    // console.warn('STORE INIT', state);
    storeSingleton = createStore(state || {});
    // on updates persist state in storage and propagate to replicas
    storeSingleton.subscribe(() => {
      const state = storeSingleton.getState();

      browser.storage.local.set({ [REDUX_STORAGE_KEY]: state }).catch(e => {
        console.error('STORE SAVE ERROR: ', e);
      });

      const popupState = selectPopupState(storeSingleton.getState());
      browser.runtime
        .sendMessage(backgroundEvent.popupStateUpdated(popupState))
        .catch(err => {
          // will fail when extension is closed
        });
    });
    // send start action
    storeSingleton.dispatch(startApp());
  } else {
    // console.warn('STORE REUSED', state);
  }

  return storeSingleton;
}

export function createMainStoreReplica<T extends PopupState>(state: T) {
  const store = createStore(state);
  return store;
}

export function dispatchToMainStore(action: ReduxAction) {
  browser.runtime.sendMessage(action);
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
