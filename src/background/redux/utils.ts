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

export function* sagaSelect<T>(selector: (state: RootState) => T) {
  const res: T = yield select(selector);
  return res;
}

// eslint-disable-next-line require-yield
export function* sagaCall<T>(fn: (...args: any) => Promise<T>) {
  const res: T = yield call(fn) as T;
  return res;
}
