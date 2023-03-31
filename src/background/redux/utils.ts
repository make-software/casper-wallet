import { compose } from 'redux';
import { composeWithDevTools } from 'remote-redux-devtools';
import browser from 'webextension-polyfill';
import { RootState } from 'typesafe-actions';
import { select, call } from 'redux-saga/effects';

import { createStore } from '@src/background/redux';
import { backgroundEvent } from '@src/background/background-events';
import { ServiceMessage } from '@background/service-message';

import { ReduxAction } from './redux-action';
import { startBackground } from './sagas/actions';
import { KeysState } from './keys/types';
import { LoginRetryCountState } from './login-retry-count/reducer';
import { LoginRetryLockoutTimeState } from './login-retry-lockout-time/types';
import { VaultCipherState } from './vault-cipher/types';
import { WindowManagementState } from './windowManagement/types';
import { DeploysState } from './deploys/types';
import { VaultState } from './vault/types';
import { SessionState } from './session/types';
import { LastActivityTimeState } from './last-activity-time/reducer';
import { SettingsState } from './settings/types';
import { ActiveOriginState } from './active-origin/types';

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
// If this flag is true, we initialize the initial state for the tests
const isMockStateEnable = Boolean(process.env.MOCK_STATE);

export const VAULT_CIPHER_KEY = 'zazXu8w9GyCtxZ';
export const KEYS_KEY = '2yNVAEQJB5rxMg';
export const LOGIN_RETRY_KEY = '7ZVdMbk9yD8WGZ';
export const LOGIN_RETRY_LOCKOUT_KEY = 'p6nnYiaxcsaNG3';
export const LAST_ACTIVITY_TIME = 'j8d1dusn76EdD';
export const VAULT_SETTINGS = 'Nmxd8BZh93MHua';

type StorageState = {
  [VAULT_CIPHER_KEY]: string;
  [KEYS_KEY]: KeysState;
  [LOGIN_RETRY_KEY]: LoginRetryCountState;
  [LOGIN_RETRY_LOCKOUT_KEY]: LoginRetryLockoutTimeState;
  [LAST_ACTIVITY_TIME]: number;
  [VAULT_SETTINGS]: SettingsState;
};

// this needs to be private
let storeSingleton: ReturnType<typeof createStore>;

export async function getExistingMainStoreSingletonOrInit() {
  // load selected state
  const {
    [VAULT_CIPHER_KEY]: vaultCipher,
    [KEYS_KEY]: keys,
    [LOGIN_RETRY_KEY]: loginRetryCount,
    [LOGIN_RETRY_LOCKOUT_KEY]: loginRetryLockoutTime,
    [LAST_ACTIVITY_TIME]: lastActivityTime,
    [VAULT_SETTINGS]: settings
  } = (await browser.storage.local.get([
    VAULT_CIPHER_KEY,
    KEYS_KEY,
    LOGIN_RETRY_KEY,
    LOGIN_RETRY_LOCKOUT_KEY,
    LAST_ACTIVITY_TIME,
    VAULT_SETTINGS
  ])) as StorageState;

  if (storeSingleton == null) {
    // console.warn('STORE INIT', state);
    if (isMockStateEnable) {
      const { initialStateForPopupTests } = await import(
        /* webpackMode: "eager" */ '@src/fixtures'
      );
      storeSingleton = createStore(initialStateForPopupTests as PopupState);
    } else {
      storeSingleton = createStore({
        vaultCipher,
        keys,
        loginRetryCount,
        loginRetryLockoutTime,
        lastActivityTime,
        settings
      });
    }
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
      const {
        vaultCipher,
        keys,
        loginRetryCount,
        loginRetryLockoutTime,
        lastActivityTime,
        settings
      } = state;
      browser.storage.local
        .set({
          [VAULT_CIPHER_KEY]: vaultCipher,
          [KEYS_KEY]: keys,
          [LOGIN_RETRY_KEY]: loginRetryCount,
          [LOGIN_RETRY_LOCKOUT_KEY]: loginRetryLockoutTime,
          [LAST_ACTIVITY_TIME]: lastActivityTime,
          [VAULT_SETTINGS]: settings
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

export type PopupState = {
  keys: KeysState;
  session: SessionState;
  loginRetryCount: LoginRetryCountState;
  vault: VaultState;
  deploys: DeploysState;
  windowManagement: WindowManagementState;
  vaultCipher: VaultCipherState;
  loginRetryLockoutTime: LoginRetryLockoutTimeState;
  lastActivityTime: LastActivityTimeState;
  settings: SettingsState;
  activeOrigin: ActiveOriginState;
};

// These state keys will be passed to popups
export const selectPopupState = (state: RootState): PopupState => {
  // TODO: must sanitize state to not send private data back to front
  return {
    keys: state.keys,
    loginRetryCount: state.loginRetryCount,
    session: state.session,
    vault: state.vault,
    deploys: state.deploys,
    windowManagement: state.windowManagement,
    vaultCipher: state.vaultCipher,
    loginRetryLockoutTime: state.loginRetryLockoutTime,
    lastActivityTime: state.lastActivityTime,
    activeOrigin: state.activeOrigin,
    settings: state.settings
  };
};

export function createMainStoreReplica<T extends PopupState>(state: T) {
  const store = createStore(state);
  return store;
}

export function dispatchToMainStore(action: ReduxAction | ServiceMessage) {
  return browser.runtime.sendMessage(action).catch(err => {
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
