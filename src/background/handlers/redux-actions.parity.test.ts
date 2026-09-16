import * as accountInfoActions from '@background/redux/account-info/actions';
import * as appEventsActions from '@background/redux/app-events/actions';
import * as contactsActions from '@background/redux/contacts/actions';
import * as csprNameExpirationsActions from '@background/redux/cspr-name-expirations/actions';
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
// webextension-polyfill (throws outside a browser extension).
jest.mock('@background/open-onboarding-flow', () => ({
  enableOnboardingFlow: jest.fn().mockResolvedValue(undefined)
}));
// Same reason: redux-actions.ts imports attach-window-to-request, which reaches
// for `windows` directly.
jest.mock('webextension-polyfill', () => ({ windows: { get: jest.fn() } }));

/**
 * Parity guard for `FORWARDED_ACTION_TYPES`. The set is hand-maintained and
 * fail-closed, so a forgotten append produces no compile-time signal and is
 * silently dropped at runtime. Asserts both directions of drift against the same
 * action modules `redux-actions.ts` imports, minus the EXCLUSIONS below.
 */

type ActionCreatorLike = { type: string };

function isActionCreator(value: unknown): value is ActionCreatorLike {
  return (
    typeof value === 'function' &&
    typeof (value as { type?: unknown }).type === 'string'
  );
}

/**
 * The 18 action modules `redux-actions.ts` pulls creators from. `background-events`
 * is intentionally absent: `popupStateUpdated` has its own `.match` branch.
 */
const ACTION_MODULES: Record<string, unknown>[] = [
  accountInfoActions,
  appEventsActions,
  contactsActions,
  csprNameExpirationsActions,
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

/** Every `.type` reachable as an RTK action creator across the 18 modules. */
const UNIVERSE_TYPES: ReadonlySet<string> = new Set(
  ACTION_MODULES.flatMap(mod =>
    Object.values(mod)
      .filter(isActionCreator)
      .map(creator => creator.type)
  )
);

/**
 * Creators that live in the universe but must NOT be forwarded through the set.
 * Each is dispatched only from within the background, or is intercepted by a
 * dedicated branch — never forwarded blindly from the UI.
 */
const EXCLUSIONS: ReadonlySet<string> = new Set(
  [
    // Background-only bootstrap: dispatched by get-main-store.ts when the
    // service worker (re)starts; sagas resume timers off it.
    sagasActions.startBackground,
    // UI-dispatched, but intercepted by the dedicated `resetVault` branch in
    // handleReduxAction, which runs enableOnboardingFlow.
    sagasActions.resetVault,
    // Background-only: dispatched by the sdk-methods handler when a dapp sends
    // a deploy to be signed.
    vaultActions.deployPayloadReceived,
    // Background-only: dispatched by the sdk-methods handler for an EIP-712
    // signature request.
    vaultActions.eip712PayloadReceived,
    // Background-only: dispatched by sdk-methods when opening an approval
    // window.
    windowManagementActions.windowRequestOpened,
    // Background-only: dispatched by sdk-response-to-tab when a request is
    // answered, and by all three cancel causes.
    windowManagementActions.windowRequestResponded,
    // Background-only: dispatched by the cancel path when a window closes or
    // is reused for a new request.
    windowManagementActions.windowDetachedFromRequests,
    // Background-only: `openWindow` owns the tracked approval-window slot. Were
    // these forwarded, any extension page could retarget it by sendMessage.
    windowManagementActions.windowIdChanged,
    windowManagementActions.windowIdCleared,
    // UI-dispatched but intercepted by its own branch: forwarded blindly, a dead
    // windowId enters `windowIds` and the request can then never be cancelled.
    windowManagementActions.windowRequestWindowAttached,
    // UI-dispatched but intercepted by its own branch: it decides whether the
    // shared approval window may be reused, so a page may only set it on its own.
    windowManagementActions.windowRequestDeviceConfirmationChanged,
    // UI-dispatched but intercepted by its own branch: it has no reducer case, so
    // forwarding it would be a silent no-op.
    ledgerActions.closeLedgerFlowWindows,
    // Background-only: `yield put` inside vault-sagas on successful unlock.
    loginRetryLockoutTimeActions.loginRetryLockoutTimeReseted,
    // Background-only: `yield put` inside check-casper2-network-saga.
    settingsActions.casperNetworkApiVersionChanged,
    // Background-only: `yield put` from the saga catch sites. The UI reads it via
    // selectSagaErrors and dispatches only dismissSagaError, which IS forwarded.
    appEventsActions.sagaError,
    // Background-only: put by the export-keys-window saga to retract the previous
    // attempt. The UI's dismiss button dispatches dismissSagaError by id instead.
    appEventsActions.dismissSagaErrorsBySource,
    // Background-only: put by the export-keys-window saga and by the onRemoved
    // listener on close. The UI dispatches only openExportKeysWindow.
    windowManagementActions.exportKeysWindowIdChanged,
    windowManagementActions.exportKeysWindowIdCleared,
    // Background-only: `yield put` from vault- and onboarding-sagas. Forwarding
    // lets any extension page overwrite the stored vault cipher with any bytes.
    keysActions.keysUpdated,
    sessionActions.encryptionKeyHashCreated,
    vaultCipherActions.vaultCipherCreated,
    // Background-only: `armLockoutSaga` arms the lockout on every increment.
    // Forwarding lets any extension page set or clear a security control's clock.
    loginRetryLockoutTimeActions.loginRetryLockoutTimeSet,
    // Background-only: it carries two plaintext passwords, so it travels over the
    // privileged port, not runtime.sendMessage's fan-out to every open page.
    sagasActions.changePassword,
    // Background-only: produced by `unlock-requests.ts`. It writes a
    // caller-supplied cipher to storage, so forwarding it is a write sink.
    sagasActions.unlockVault,
    // Background-only: the background owns the retry counter, so a page cannot
    // forge attempts or clear the count.
    loginRetryCountActions.loginRetryCountIncremented,
    loginRetryCountActions.loginRetryCountReseted,
    // Background-only: `yield put` inside `resetVaultSaga`; a saga `put` never
    // reaches `handleReduxAction` at all.
    windowManagementActions.windowManagementReseted
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

  it('changePassword is NOT forwarded — it travels over the privileged port', () => {
    // The set-algebra assertions above stay true when a type moves between the two
    // sets, so a paired edit passes all of them; this membership gets its own pin.
    expect(FORWARDED_ACTION_TYPES.has(sagasActions.changePassword.type)).toBe(
      false
    );
  });

  it('windowRequestWindowAttached is NOT blindly forwarded — it has a dedicated branch', () => {
    // It must reach the background, but through the dedicated branch that verifies
    // the window is alive, not through the generic forwarding set.
    expect(
      FORWARDED_ACTION_TYPES.has(
        windowManagementActions.windowRequestWindowAttached.type
      )
    ).toBe(false);
  });
});
