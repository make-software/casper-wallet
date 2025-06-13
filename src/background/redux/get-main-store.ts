import { RootState } from 'typesafe-actions';
import { runtime, storage } from 'webextension-polyfill';

import { backgroundEvent } from '@background/background-events';
import { AppEventsState } from '@background/redux/app-events/types';
import { ContactsState } from '@background/redux/contacts/types';
import { createStore } from '@background/redux/index';
import { KeysState } from '@background/redux/keys/types';
import { LoginRetryCountState } from '@background/redux/login-retry-count/reducer';
import { LoginRetryLockoutTimeState } from '@background/redux/login-retry-lockout-time/types';
import { RateAppState } from '@background/redux/rate-app/types';
import { RecentRecipientPublicKeysState } from '@background/redux/recent-recipient-public-keys/types';
import { startBackground } from '@background/redux/sagas/actions';
import { SettingsState } from '@background/redux/settings/types';
import { PopupState } from '@background/redux/types';

export const VAULT_CIPHER_KEY = 'zazXu8w9GyCtxZ';
export const KEYS_KEY = '2yNVAEQJB5rxMg';
export const LOGIN_RETRY_KEY = '7ZVdMbk9yD8WGZ';
export const LOGIN_RETRY_LOCKOUT_KEY = 'p6nnYiaxcsaNG3';
export const LAST_ACTIVITY_TIME = 'j8d1dusn76EdD';
export const VAULT_SETTINGS = 'Nmxd8BZh93MHua';
export const RECENT_RECIPIENT_PUBLIC_KEYS = '7c2WyRuGhEtaDX';
export const CONTACTS_KEY = 'teuwe6zH3A72gc';
export const RATE_APP = 'p4cGYubbwnd9ke';
export const APP_EVENTS = 'k4uL4wqkvCMoxB';

type StorageState = {
  [VAULT_CIPHER_KEY]: string;
  [KEYS_KEY]: KeysState;
  [LOGIN_RETRY_KEY]: LoginRetryCountState;
  [LOGIN_RETRY_LOCKOUT_KEY]: LoginRetryLockoutTimeState;
  [LAST_ACTIVITY_TIME]: number;
  [VAULT_SETTINGS]: SettingsState;
  [RECENT_RECIPIENT_PUBLIC_KEYS]: RecentRecipientPublicKeysState;
  [CONTACTS_KEY]: ContactsState;
  [RATE_APP]: RateAppState;
  [APP_EVENTS]: AppEventsState;
};
// this needs to be private
let storeSingleton: ReturnType<typeof createStore>;

// These state keys will be passed to popups
export const selectPopupState = (state: RootState): PopupState => {
  // TODO: must sanitize state to not send private data back to front
  return {
    keys: state.keys,
    loginRetryCount: state.loginRetryCount,
    session: state.session,
    vault: state.vault,
    windowManagement: state.windowManagement,
    vaultCipher: state.vaultCipher,
    loginRetryLockoutTime: state.loginRetryLockoutTime,
    lastActivityTime: state.lastActivityTime,
    activeOrigin: state.activeOrigin,
    activeOriginFavicon: state.activeOriginFavicon,
    settings: state.settings,
    recentRecipientPublicKeys: state.recentRecipientPublicKeys,
    accountInfo: state.accountInfo,
    contacts: state.contacts,
    rateApp: state.rateApp,
    ledger: state.ledger,
    appEvents: state.appEvents
  };
};

// If this flag is true, we initialize the initial state for the tests
const isMockStateEnable = Boolean(process.env.MOCK_STATE);

export async function getExistingMainStoreSingletonOrInit() {
  try {
    // load selected state
    const {
      [VAULT_CIPHER_KEY]: vaultCipher,
      [KEYS_KEY]: keys,
      [LOGIN_RETRY_KEY]: loginRetryCount,
      [LOGIN_RETRY_LOCKOUT_KEY]: loginRetryLockoutTime,
      [LAST_ACTIVITY_TIME]: lastActivityTime,
      [VAULT_SETTINGS]: settings,
      [RECENT_RECIPIENT_PUBLIC_KEYS]: recentRecipientPublicKeys,
      [CONTACTS_KEY]: contacts,
      [RATE_APP]: rateApp,
      [APP_EVENTS]: appEvents
    } = (await storage.local.get([
      VAULT_CIPHER_KEY,
      KEYS_KEY,
      LOGIN_RETRY_KEY,
      LOGIN_RETRY_LOCKOUT_KEY,
      LAST_ACTIVITY_TIME,
      VAULT_SETTINGS,
      RECENT_RECIPIENT_PUBLIC_KEYS,
      CONTACTS_KEY,
      RATE_APP,
      APP_EVENTS
    ])) as StorageState;

    if (storeSingleton == null) {
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
          settings,
          recentRecipientPublicKeys,
          contacts,
          rateApp,
          appEvents
        });
      }
      // send start action
      storeSingleton.dispatch(startBackground());
      // on updates propagate new state to replicas and also persist encrypted vault
      storeSingleton.subscribe(() => {
        const state = storeSingleton.getState();

        // propagate state to replicas
        const popupState = selectPopupState(state);
        runtime.sendMessage(backgroundEvent.popupStateUpdated(popupState));

        // persist selected state
        const {
          vaultCipher,
          keys,
          loginRetryCount,
          loginRetryLockoutTime,
          lastActivityTime,
          settings,
          recentRecipientPublicKeys,
          contacts,
          rateApp,
          appEvents
        } = state;
        storage.local
          .set({
            [VAULT_CIPHER_KEY]: vaultCipher,
            [KEYS_KEY]: keys,
            [LOGIN_RETRY_KEY]: loginRetryCount,
            [LOGIN_RETRY_LOCKOUT_KEY]: loginRetryLockoutTime,
            [LAST_ACTIVITY_TIME]: lastActivityTime,
            [VAULT_SETTINGS]: settings,
            [RECENT_RECIPIENT_PUBLIC_KEYS]: recentRecipientPublicKeys,
            [CONTACTS_KEY]: contacts,
            [RATE_APP]: rateApp,
            [APP_EVENTS]: appEvents
          })
          .catch(e => {
            console.error('Persist encrypted vault failed: ', e);
          });
      });
    }
  } catch (e) {
    console.error('Failed to retrieve data from local storage: ', e);
  }

  return storeSingleton;
}

export function createMainStoreReplica<T extends PopupState>(state: T) {
  return createStore(state);
}
