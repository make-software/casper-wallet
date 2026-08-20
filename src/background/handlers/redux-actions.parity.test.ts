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
// webextension-polyfill (throws outside a browser extension). Stub it — this
// test never invokes handleReduxAction, it only reads the exported set.
jest.mock('@background/open-onboarding-flow', () => ({
  enableOnboardingFlow: jest.fn().mockResolvedValue(undefined)
}));
// Same reason, second route: redux-actions.ts imports attach-window-to-request,
// which reaches for `windows` directly.
jest.mock('webextension-polyfill', () => ({ windows: { get: jest.fn() } }));

/**
 * Parity guard for `FORWARDED_ACTION_TYPES`.
 *
 * `handleReduxAction` (redux-actions.ts) only re-dispatches via the generic
 * forwarding path when the sender passes `isTrustedUiSender` AND the action's
 * `.type` is present in the hand-maintained `FORWARDED_ACTION_TYPES` set. The
 * set is fail-closed (an unknown type is dropped and `{ handled: false }` is
 * returned), so forgetting to append a newly-added UI action produces NO
 * compile-time signal — the action is just silently dropped at runtime.
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
 * The 18 action modules `redux-actions.ts` pulls creators from. `background-
 * events` is intentionally NOT here: its `popupStateUpdated` is a
 * `backgroundEvent`, handled by the dedicated `.match` branch, not the set.
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
    // Background-only: dispatched by sdk-methods when opening an approval
    // window (tracks the in-flight request). Never dispatched from the UI.
    windowManagementActions.windowRequestOpened,
    // Background-only: dispatched by sdk-response-to-tab when a request is
    // answered back to the tab, and by all three cancel causes (window closed /
    // window reused / window failed to open) when a request is cancelled.
    // Never dispatched from the UI.
    windowManagementActions.windowRequestResponded,
    // Background-only: dispatched by the cancel path when a window closes or
    // is reused for a new request. Never dispatched from the UI.
    windowManagementActions.windowDetachedFromRequests,
    // Background-only: the tracked approval-window slot is written by
    // `openWindow` and by `createOpenWindow`'s background caller. Its only UI
    // dispatcher was `use-window-manager`, whose inputs were dead — both
    // consumers pass `isNewWindow: true`, so the reuse branch never ran. While
    // these stayed forwardable, any extension UI page could `runtime.sendMessage`
    // a `windowIdChanged(<arbitrary id>)` and retarget the slot that decides
    // which window a dapp approval belongs to.
    windowManagementActions.windowIdChanged,
    windowManagementActions.windowIdCleared,
    // UI-dispatched (use-ledger registers the Ledger permission window), but
    // intercepted by the dedicated `windowRequestWindowAttached` branch in
    // handleReduxAction — deliberately not in the forwarding set. Forwarding it
    // blindly would let a dead or bogus windowId into `windowIds`, and a
    // request whose set can never shrink to the window that went away is a
    // request nothing can ever cancel.
    windowManagementActions.windowRequestWindowAttached,
    // UI-dispatched (use-ledger, around the device call), but intercepted by its
    // own branch in handleReduxAction — deliberately not in the forwarding set,
    // which checks no sender at all. It decides whether the shared approval
    // window may be reused, so a page must only be able to set it on the request
    // its own URL names.
    windowManagementActions.windowRequestDeviceConfirmationChanged,
    // UI-dispatched (use-ledger, when a Ledger flow ends), but intercepted by
    // the dedicated `closeLedgerFlowWindows` branch in handleReduxAction —
    // deliberately not in the forwarding set. It has no reducer case at all, so
    // forwarding it would be a silent no-op, and the windows it closes are
    // resolved from `windowManagement.requests`, which the background alone holds.
    ledgerActions.closeLedgerFlowWindows,
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
    appEventsActions.sagaError,
    // Background-only: put by the export-keys-window saga before each attempt,
    // to retract what the previous attempt reported. The UI's only retraction
    // path is the banner's dismiss button, which dispatches dismissSagaError by
    // id (which IS forwarded) — never this one.
    appEventsActions.dismissSagaErrorsBySource,
    // Background-only: put by the export-keys-window saga (create / stale-heal)
    // and store.dispatch'd by the onRemoved listener on close. The UI
    // dispatches only openExportKeysWindow.
    windowManagementActions.exportKeysWindowIdChanged,
    // Background-only: put by the export-keys-window saga (create / stale-heal)
    // and store.dispatch'd by the onRemoved listener on close. The UI
    // dispatches only openExportKeysWindow.
    windowManagementActions.exportKeysWindowIdCleared,
    // Background-only since WALLET-1385: `handleReduxAction` forwards
    // allow-listed actions without checking which page sent them, so while
    // these stayed forwardable a compromised extension page could overwrite
    // the stored vault cipher with arbitrary bytes via `runtime.sendMessage`.
    // `yield put` only, from vault-sagas (unlock / recover / change-password)
    // and onboarding-sagas — never dispatched from the UI anymore now that
    // change-password re-encrypts inside `changePasswordSaga` (dispatched via
    // the privileged port, not the forwarding set) instead of the page.
    keysActions.keysUpdated,
    sessionActions.encryptionKeyHashCreated,
    vaultCipherActions.vaultCipherCreated,
    // Background-only since WALLET-1424: `armLockoutSaga` arms the lockout from
    // the background on every increment, so no page dispatches this. Forwarding
    // it would let any extension page set or clear a security control's clock.
    loginRetryLockoutTimeActions.loginRetryLockoutTimeSet,
    // Background-only since WALLET-1424: it carries two plaintext passwords, so
    // it travels over the privileged port instead of runtime.sendMessage, which
    // delivers to every open extension page.
    sagasActions.changePassword,
    // Background-only since WALLET-1424: the background performs the unlock, so
    // this action is produced by `unlock-requests.ts` and never by a page. It
    // writes a caller-supplied cipher to storage, which is why forwarding it was
    // a write sink.
    sagasActions.unlockVault,
    // Background-only since WALLET-1424: the background owns the retry counter,
    // so a page can no longer forge attempts or clear the count.
    loginRetryCountActions.loginRetryCountIncremented,
    loginRetryCountActions.loginRetryCountReseted
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

  it('changePassword is NOT forwarded — it travels over the privileged port', () => {
    // The set-algebra assertions above all stay true when a type moves between
    // the two sets, so a paired edit — re-adding it here while deleting its
    // EXCLUSIONS entry — passes every one of them. Membership is what lets the
    // background accept two plaintext passwords over the fan-out channel from
    // any trusted-UI page, so it gets its own pin.
    expect(FORWARDED_ACTION_TYPES.has(sagasActions.changePassword.type)).toBe(
      false
    );
  });

  it('windowRequestWindowAttached is NOT blindly forwarded — it has a dedicated branch', () => {
    // The Ledger hook dispatches it from a UI page, so it must reach the
    // background; but it must arrive through `handleReduxAction`'s dedicated
    // branch, which verifies the window is alive, not through the generic
    // forwarding set. Putting it back in the set would silently restore the
    // "attach a dead windowId and the request can never be cancelled" hole.
    expect(
      FORWARDED_ACTION_TYPES.has(
        windowManagementActions.windowRequestWindowAttached.type
      )
    ).toBe(false);
  });
});
