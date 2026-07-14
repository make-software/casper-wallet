import * as accountInfoActions from '@background/redux/account-info/actions';
import * as appEventsActions from '@background/redux/app-events/actions';
import * as contactsActions from '@background/redux/contacts/actions';
import * as keysActions from '@background/redux/keys/actions';
import * as lastActivityTimeActions from '@background/redux/last-activity-time/actions';
import * as ledgerActions from '@background/redux/ledger/actions';
import * as loginRetryCountActions from '@background/redux/login-retry-count/actions';
import * as loginRetryLockoutTimeActions from '@background/redux/login-retry-lockout-time/actions';
import * as rateAppActions from '@background/redux/rate-app/actions';
import * as recentRecipientPublicKeysActions from '@background/redux/recent-recipient-public-keys/actions';
import * as sagasActions from '@background/redux/sagas/actions';
import * as sessionActions from '@background/redux/session/actions';
import * as settingsActions from '@background/redux/settings/actions';
import * as trustedWasmActions from '@background/redux/trusted-wasm/actions';
import * as vaultCipherActions from '@background/redux/vault-cipher/actions';
import * as vaultActions from '@background/redux/vault/actions';
import * as windowManagementActions from '@background/redux/windowManagement/actions';

import { FORWARDED_ACTION_TYPES } from './redux-actions';

// redux-actions.ts transitively imports open-onboarding-flow, which pulls in
// webextension-polyfill (throws outside a browser extension). Stub it — this
// test never invokes handleReduxAction, it only reads the exported set.
jest.mock('@background/open-onboarding-flow', () => ({
  enableOnboardingFlow: jest.fn().mockResolvedValue(undefined)
}));

/**
 * Parity guard for `FORWARDED_ACTION_TYPES`.
 *
 * `handleReduxAction` (redux-actions.ts) only re-dispatches a UI-originated
 * Redux action into the background store when its `.type` is present in the
 * hand-maintained `FORWARDED_ACTION_TYPES` set. The set is fail-closed (an
 * unknown type is dropped and `{ handled: false }` is returned), so forgetting
 * to append a newly-added UI action produces NO compile-time signal — the
 * action is just silently dropped at runtime.
 *
 * This test reconstructs the "creator universe" from the exact same action
 * modules `redux-actions.ts` imports and asserts BOTH directions of drift:
 *   - every forwardable creator is in the set (a forgotten append fails), and
 *   - every set entry maps to a live creator (a stale entry fails).
 *
 * The only creators allowed to exist in the universe yet be absent from the set
 * are the explicit, justified EXCLUSIONS below (background-only or specially
 * handled). Anything else surfacing here is either a real forwarding bug or a
 * new exclusion that must be reasoned about — not silently added.
 */

type ActionCreatorLike = { type: string };

function isActionCreator(value: unknown): value is ActionCreatorLike {
  return (
    typeof value === 'function' &&
    typeof (value as { type?: unknown }).type === 'string'
  );
}

/**
 * The 17 action modules `redux-actions.ts` pulls creators from. `background-
 * events` is intentionally NOT here: its `popupStateUpdated` is a
 * `backgroundEvent`, handled by the dedicated `.match` branch, not the set.
 */
const ACTION_MODULES: Record<string, unknown>[] = [
  accountInfoActions,
  appEventsActions,
  contactsActions,
  keysActions,
  lastActivityTimeActions,
  ledgerActions,
  loginRetryCountActions,
  loginRetryLockoutTimeActions,
  rateAppActions,
  recentRecipientPublicKeysActions,
  sagasActions,
  sessionActions,
  settingsActions,
  trustedWasmActions,
  vaultActions,
  vaultCipherActions,
  windowManagementActions
];

/** Every `.type` reachable as an RTK action creator across the 17 modules. */
const UNIVERSE_TYPES: ReadonlySet<string> = new Set(
  ACTION_MODULES.flatMap(mod =>
    Object.values(mod)
      .filter(isActionCreator)
      .map(creator => creator.type)
  )
);

/**
 * Creators that live in the universe but must NOT be forwarded through the set.
 * Each is dispatched only from within the background (sagas / handlers /
 * bootstrap) or is intercepted by a dedicated branch — never forwarded blindly
 * from the UI. Verified 2026-07-10 (no UI `dispatchToMainStore` call sites).
 */
const EXCLUSIONS: ReadonlySet<string> = new Set(
  [
    // Background-only bootstrap: dispatched by get-main-store.ts when the
    // service worker (re)starts; sagas resume timers off it. Never from UI.
    sagasActions.startBackground,
    // UI-dispatched, but intercepted by the dedicated `resetVault` branch in
    // handleReduxAction (runs enableOnboardingFlow) — deliberately not in the
    // forwarding set.
    sagasActions.resetVault,
    // Background-only: dispatched by the sdk-methods handler when a dapp sends
    // a deploy to be signed. Never dispatched from the UI.
    vaultActions.deployPayloadReceived,
    // Background-only: dispatched by the sdk-methods handler for an EIP-712
    // signature request. Never dispatched from the UI.
    vaultActions.eip712PayloadReceived,
    // Background-only: retained for the reducer/parity guard but no longer
    // dispatched (the close path now uses windowIdCleared). Never from the UI.
    windowManagementActions.windowClosed,
    // Background-only: dispatched by sdk-methods when opening an approval
    // window (tracks the in-flight request). Never dispatched from the UI.
    windowManagementActions.windowRequestOpened,
    // Background-only: dispatched by sdk-response-to-tab when a request is
    // answered back to the tab. Never dispatched from the UI.
    windowManagementActions.windowRequestResponded,
    // Background-only: `yield put` inside vault-sagas on successful unlock.
    // Never dispatched from the UI.
    loginRetryLockoutTimeActions.loginRetryLockoutTimeReseted,
    // Background-only: `yield put` inside check-casper2-network-saga after
    // probing the node API version. Never dispatched from the UI.
    settingsActions.casperNetworkApiVersionChanged,
    // Background-only: `yield put` from the saga catch sites (P1.2 saga-error
    // channel) in vault/onboarding/network sagas. The UI reads it via
    // selectSagaErrors and dispatches only dismissSagaError (which IS
    // forwarded); sagaError itself is never dispatched from the UI.
    appEventsActions.sagaError
  ].map(creator => creator.type)
);

const sorted = (values: Iterable<string>): string[] =>
  [...values].sort((a, b) => a.localeCompare(b));

const difference = (a: ReadonlySet<string>, b: ReadonlySet<string>): string[] =>
  [...a].filter(type => !b.has(type));

const intersection = (
  a: ReadonlySet<string>,
  b: ReadonlySet<string>
): string[] => [...a].filter(type => b.has(type));

describe('FORWARDED_ACTION_TYPES parity', () => {
  it('every EXCLUSIONS entry is a real creator in the universe', () => {
    // Guards the exclusion list itself against typos / renamed creators.
    expect(difference(EXCLUSIONS, UNIVERSE_TYPES)).toEqual([]);
  });

  it('FORWARDED and EXCLUSIONS are disjoint', () => {
    // A type must not be both forwarded and excluded.
    expect(intersection(FORWARDED_ACTION_TYPES, EXCLUSIONS)).toEqual([]);
  });

  it('FORWARDED ∪ EXCLUSIONS covers the entire creator universe', () => {
    const covered = new Set<string>([...FORWARDED_ACTION_TYPES, ...EXCLUSIONS]);
    expect(sorted(covered)).toEqual(sorted(UNIVERSE_TYPES));
  });

  it('no forwardable creator is missing from FORWARDED_ACTION_TYPES', () => {
    // universe \ EXCLUSIONS ⊆ FORWARDED — a forgotten append fails here.
    const forwardable = new Set(difference(UNIVERSE_TYPES, EXCLUSIONS));
    expect(difference(forwardable, FORWARDED_ACTION_TYPES)).toEqual([]);
  });

  it('no stale FORWARDED_ACTION_TYPES entry lacks a live creator', () => {
    // FORWARDED ⊆ universe — a removed/renamed creator leaves a stale entry.
    expect(difference(FORWARDED_ACTION_TYPES, UNIVERSE_TYPES)).toEqual([]);
  });

  it('exact set equality: universe \\ EXCLUSIONS === FORWARDED_ACTION_TYPES', () => {
    const forwardable = new Set(difference(UNIVERSE_TYPES, EXCLUSIONS));
    expect(sorted(FORWARDED_ACTION_TYPES)).toEqual(sorted(forwardable));
  });
});
