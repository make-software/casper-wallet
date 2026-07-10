import { runtime, storage } from 'webextension-polyfill';

import { backgroundEvent } from '@background/background-events';
import { AppEventsState } from '@background/redux/app-events/types';
import { ContactsState } from '@background/redux/contacts/types';
import { createStore } from '@background/redux/index';
import { withDerivedFlag } from '@background/redux/keys/reducer';
import { KeysState } from '@background/redux/keys/types';
import { LoginRetryCountState } from '@background/redux/login-retry-count/reducer';
import { LoginRetryLockoutTimeState } from '@background/redux/login-retry-lockout-time/types';
import { RateAppState } from '@background/redux/rate-app/types';
import { RecentRecipientPublicKeysState } from '@background/redux/recent-recipient-public-keys/types';
import { startBackground } from '@background/redux/sagas/actions';
import { SettingsState } from '@background/redux/settings/types';
import { RootState } from '@background/redux/store-types';
import { TrustedWasmState } from '@background/redux/trusted-wasm/types';
import { PopupState } from '@background/redux/types';

// `storage.local` key names below are immutable and append-only: renaming or
// repurposing one strands/drops the persisted data under the old name on
// upgrade (VAULT_CIPHER_KEY is the worst case — it bricks existing vaults).
// Add a new key for new data; never rename or reuse an existing one. Full
// inventory, secrecy, and rationale: docs/architecture/storage-keys.md
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
export const TRUSTED_WASM = 'k1uC4wqkwCMwxL';

// Absolute-timestamp deadlines (`Date.now() + remaining`, in ms) written
// directly to `storage.local` by the vault sagas so the login-retry lockout and
// the auto-lock inactivity timers survive MV3 service-worker restarts. These are
// NOT part of the Redux state shape — they are standalone storage entries the
// sagas read on `startBackground` to resume the residual delay.
//
// IMPORTANT: once shipped, these key strings are immutable. Existing installs
// persist deadlines under exactly these strings; renaming them would strand the
// old entries and break resume-after-restart for already-locked-out users.
// See docs/architecture/storage-keys.md for the full key inventory.
export const LOGIN_RETRY_LOCKOUT_DEADLINE_KEY = 'q9Tf3Lm4pRxVne';
export const AUTO_LOCK_DEADLINE_KEY = 'r3Wj7Nc8vBhQyD';

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
  [TRUSTED_WASM]: TrustedWasmState;
};
// this needs to be private
let storeSingleton: ReturnType<typeof createStore>;

// These state keys will be passed to popups. P0.1: cipher/hash material is
// NOT broadcast — UI flows that need it use fetchPrivateState() explicitly.
export const selectPopupState = (state: RootState): PopupState => {
  return {
    keys: {
      passwordHash: null,
      passwordSaltHash: null,
      keyDerivationSaltHash: null,
      keysDoesExist: state.keys.keysDoesExist
    },
    session: { ...state.session, encryptionKeyHash: null },
    loginRetryCount: state.loginRetryCount,
    vault: state.vault,
    windowManagement: state.windowManagement,
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
    appEvents: state.appEvents,
    trustedWasm: state.trustedWasm
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
      [APP_EVENTS]: appEvents,
      [TRUSTED_WASM]: trustedWasm
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
      APP_EVENTS,
      TRUSTED_WASM
    ])) as StorageState;

    if (storeSingleton == null) {
      if (isMockStateEnable) {
        const { initialStateForPopupTests } = await import(
          /* webpackMode: "eager" */ '@src/fixtures'
        );
        // The MOCK store IS the background store: it keeps the full RootState
        // (incl. vaultCipher + real hashes); only the broadcast is sanitized.
        storeSingleton = createStore(initialStateForPopupTests);
      } else {
        storeSingleton = createStore({
          vaultCipher,
          // Recompute keysDoesExist from the hashes via the SAME derivation the
          // reducer uses, so a stale/poisoned persisted flag can't survive a
          // restart. Single source of truth — see keys/reducer withDerivedFlag.
          keys: keys && withDerivedFlag(keys),
          loginRetryCount,
          loginRetryLockoutTime,
          lastActivityTime,
          settings,
          recentRecipientPublicKeys,
          contacts,
          rateApp,
          appEvents,
          trustedWasm
        });
      }
      // send start action
      storeSingleton.dispatch(startBackground());
      // on updates propagate new state to replicas and also persist encrypted vault
      storeSingleton.subscribe(() => {
        const state = storeSingleton.getState();

        // propagate state to replicas
        const popupState = selectPopupState(state);
        runtime
          .sendMessage(backgroundEvent.popupStateUpdated(popupState))
          .catch(() => {
            // no UI replica is open to receive the update — expected, ignore
          });

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
          appEvents,
          trustedWasm
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
            [APP_EVENTS]: appEvents,
            [TRUSTED_WASM]: trustedWasm
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

export type MainStore = Awaited<
  ReturnType<typeof getExistingMainStoreSingletonOrInit>
>;

export function createMainStoreReplica<T extends PopupState>(state: T) {
  return createStore(state);
}
