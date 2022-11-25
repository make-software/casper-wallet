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
import { startApp } from './sagas/actions';
import { KeysState } from './keys/types';

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

export const VAULT_CIPHER_KEY = 'vault_cipher';
export const KEYS_KEY = 'keys';

type StorageState = {
  [VAULT_CIPHER_KEY]: string;
  [KEYS_KEY]: KeysState;
};

// this needs to be private
let storeSingleton: ReturnType<typeof createStore>;

export async function getMainStoreSingleton() {
  // load vault and keys ciphers
  const { [VAULT_CIPHER_KEY]: vaultCipher, [KEYS_KEY]: keys } =
    (await browser.storage.local.get([
      VAULT_CIPHER_KEY,
      KEYS_KEY
    ])) as StorageState;

  if (storeSingleton == null) {
    // console.warn('STORE INIT', state);
    storeSingleton = createStore({ vaultCipher, keys });
    // on updates propagate new state to replicas and also persist encrypted vault
    storeSingleton.subscribe(() => {
      const state = storeSingleton.getState();

      // propagate state to replicas
      const popupState = selectPopupState(state);
      browser.runtime
        .sendMessage(backgroundEvent.popupStateUpdated(popupState))
        .catch(e => {
          console.error('STATE PROPAGATION FAILED: ', e);
        });

      // persist vault and keys ciphers
      const { vaultCipher, keys } = state;

      browser.storage.local
        .set({ [VAULT_CIPHER_KEY]: vaultCipher, [KEYS_KEY]: keys })
        .catch(e => {
          console.error('PERSIST ENCRYPTED VAULT FAILED: ', e);
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
