import { storage } from 'webextension-polyfill';

import { sweepOrphanedRequests } from '@background/handlers/sweep-orphaned-requests';
import { redactUrlQuery } from '@background/redact-url-query';
import { AppEventsState } from '@background/redux/app-events/types';
import { broadcastPopupState } from '@background/redux/broadcast-popup-state';
import { ContactsState } from '@background/redux/contacts/types';
import { CsprNameExpirationsState } from '@background/redux/cspr-name-expirations/types';
import { createStore } from '@background/redux/index';
import { withDerivedFlag } from '@background/redux/keys/reducer';
import { KeysState } from '@background/redux/keys/types';
import { LoginRetryCountState } from '@background/redux/login-retry-count/reducer';
import { LoginRetryLockoutTimeState } from '@background/redux/login-retry-lockout-time/types';
import { RateAppState } from '@background/redux/rate-app/types';
import { RecentRecipientPublicKeysState } from '@background/redux/recent-recipient-public-keys/types';
import { startBackground } from '@background/redux/sagas/actions';
import { SettingsState } from '@background/redux/settings/types';
import { TrustedWasmState } from '@background/redux/trusted-wasm/types';
import {
  SessionRecord,
  readRequestSession,
  writeRequestSession
} from '@background/redux/windowManagement/session-store';

// `storage.local` key names below are immutable and append-only: renaming or
// repurposing one strands/drops the persisted data under the old name on
// upgrade (VAULT_CIPHER_KEY is the worst case — it bricks existing vaults).
// Add a new key for new data; never rename or reuse an existing one. Full
// inventory, secrecy, and rationale: docs/architecture/storage-keys.md
const VAULT_CIPHER_KEY = 'zazXu8w9GyCtxZ';
export const KEYS_KEY = '2yNVAEQJB5rxMg';
const LOGIN_RETRY_KEY = '7ZVdMbk9yD8WGZ';
const LOGIN_RETRY_LOCKOUT_KEY = 'p6nnYiaxcsaNG3';
const LAST_ACTIVITY_TIME = 'j8d1dusn76EdD';
const VAULT_SETTINGS = 'Nmxd8BZh93MHua';
const RECENT_RECIPIENT_PUBLIC_KEYS = '7c2WyRuGhEtaDX';
const CONTACTS_KEY = 'teuwe6zH3A72gc';
const RATE_APP = 'p4cGYubbwnd9ke';
const APP_EVENTS = 'k4uL4wqkvCMoxB';
const TRUSTED_WASM = 'k1uC4wqkwCMwxL';
const CSPR_NAME_EXPIRATIONS = 'TVn5HXvXCfYRpJ';

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
  [CSPR_NAME_EXPIRATIONS]: CsprNameExpirationsState;
};
// this needs to be private
let storeSingleton: ReturnType<typeof createStore>;

// If this flag is true, we initialize the initial state for the tests
const isMockStateEnable = Boolean(process.env.MOCK_STATE);

export async function getExistingMainStoreSingletonOrInit() {
  try {
    // load selected state
    // In parallel, never sequentially: both reads run on EVERY invocation, i.e.
    // on every `runtime.onMessage`, to serve data consumed only when the
    // singleton is null.
    const [
      {
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
        [TRUSTED_WASM]: trustedWasm,
        [CSPR_NAME_EXPIRATIONS]: csprNameExpirations
      },
      requestSession
    ] = await Promise.all([
      storage.local.get([
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
        TRUSTED_WASM,
        CSPR_NAME_EXPIRATIONS
      ]) as Promise<StorageState>,
      isMockStateEnable
        ? Promise.resolve<SessionRecord>({ requests: {}, windowId: null })
        : readRequestSession()
    ]);

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
          appEvents: appEvents
            ? {
                dismissedEventIds: appEvents.dismissedEventIds ?? [],
                errors: [],
                nextErrorId: 0
              }
            : undefined,
          trustedWasm,
          csprNameExpirations,
          // Present before any handler can run: on Chrome/Edge `requestSession`
          // is the session mirror, rehydrating `windowManagement.requests`
          // across an MV3 restart (residual paths aside — a lost mirror write,
          // a sanitizer-dropped row); on Firefox/Safari's persistent background
          // page it is always the empty record, since nothing there restarts.
          windowManagement: {
            windowId: requestSession.windowId,
            exportKeysWindowId: null,
            requests: requestSession.requests
          }
        });
      }
      // send start action
      storeSingleton.dispatch(startBackground());
      // The PAIR, not the slice reference: the four window-id case reducers
      // return a fresh slice for a value-equal write. Baselined from the
      // hydrated pair, so a sanitizer-trimmed record is not written back until
      // the first genuine change — deliberate, not a missing write-on-init.
      let { requests: previousRequests, windowId: previousRequestWindowId } =
        storeSingleton.getState().windowManagement;
      // on updates propagate new state to replicas and also persist encrypted vault
      storeSingleton.subscribe(() => {
        const state = storeSingleton.getState();

        // propagate state to replicas
        broadcastPopupState(state);

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
          trustedWasm,
          csprNameExpirations
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
            [APP_EVENTS]: { dismissedEventIds: appEvents.dismissedEventIds },
            [TRUSTED_WASM]: trustedWasm,
            [CSPR_NAME_EXPIRATIONS]: csprNameExpirations
          })
          .catch(e => {
            // nosemgrep: cw-logging-secrets — static message + error object, no key material
            console.error('Persist encrypted vault failed: ', e);
          });

        // A separate call to a separate area with its own catch: a dapp-chosen
        // oversized `requestId` must never be able to fail the vault write.
        const { requests, windowId } = state.windowManagement;
        if (
          requests !== previousRequests ||
          windowId !== previousRequestWindowId
        ) {
          previousRequests = requests;
          previousRequestWindowId = windowId;
          writeRequestSession({ requests, windowId }).catch(e => {
            console.error('Persist request mirror failed: ', redactUrlQuery(e));
          });
        }
      });

      // Fire-and-forget hardening pass (spec §8.1): catches the two durable-
      // state freezes no window event can ever recover from. Passed the
      // hydrated snapshot rather than reading `getState()` itself — a request
      // registered moments after this line is not in it, and so cannot be
      // cancelled during its own registration→attach gap.
      void sweepOrphanedRequests(storeSingleton, requestSession.requests).catch(
        e =>
          console.error(
            'sweep-orphaned-requests: sweep failed',
            redactUrlQuery(e)
          )
      );
    }
  } catch (e) {
    console.error('Failed to retrieve data from local storage: ', e);
  }

  return storeSingleton;
}

export type MainStore = Awaited<
  ReturnType<typeof getExistingMainStoreSingletonOrInit>
>;
