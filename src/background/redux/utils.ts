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
import { startBackground } from './sagas/actions';
import { KeysState } from './keys/types';
import { LoginRetryCountState } from './login-retry-count/reducer';

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

export const VAULT_CIPHER_KEY = 'zazXu8w9GyCtxZ';
export const KEYS_KEY = '2yNVAEQJB5rxMg';
export const LOGIN_RETRY_KEY = '7ZVdMbk9yD8WGZ';

type StorageState = {
  [VAULT_CIPHER_KEY]: string;
  [KEYS_KEY]: KeysState;
  [LOGIN_RETRY_KEY]: LoginRetryCountState;
};

// this needs to be private
let storeSingleton: ReturnType<typeof createStore>;

export async function getExistingMainStoreSingletonOrInit() {
  // load selected state
  const {
    [VAULT_CIPHER_KEY]: vaultCipher,
    [KEYS_KEY]: keys,
    [LOGIN_RETRY_KEY]: loginRetryCount
  } = (await browser.storage.local.get([
    VAULT_CIPHER_KEY,
    KEYS_KEY,
    LOGIN_RETRY_KEY
  ])) as StorageState;

  if (storeSingleton == null) {
    // console.warn('STORE INIT', state);
    storeSingleton = createStore({ vaultCipher, keys, loginRetryCount });
    // send start action
    storeSingleton.dispatch(startBackground());
    // on updates propagate new state to replicas and also persist encrypted vault
    storeSingleton.subscribe(() => {
      const state = storeSingleton.getState();

      // propagate state to replicas
      const popupState = selectPopupState(state);
      browser.runtime
        .sendMessage(backgroundEvent.popupStateUpdated(popupState))
        .catch(e => {
          // console.log('STATE PROPAGATION FAILED: ', e);
        });

      // persist selected state
      const { vaultCipher, keys, loginRetryCount } = state;
      browser.storage.local
        .set({
          [VAULT_CIPHER_KEY]: vaultCipher,
          [KEYS_KEY]: keys,
          [LOGIN_RETRY_KEY]: loginRetryCount
        })
        .catch(e => {
          console.error('Persist encrypted vault failed: ', e);
        });
    });
  } else {
    // console.log('STORE REUSED', state);
  }

  return storeSingleton;
}

export function createMainStoreReplica<T extends PopupState>(state: T) {
  const store = createStore(state);
  return store;
}

export function dispatchToMainStore(action: ReduxAction) {
  return browser.runtime.sendMessage(action);
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
