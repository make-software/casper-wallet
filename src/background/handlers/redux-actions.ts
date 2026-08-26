import { Runtime } from 'webextension-polyfill';

import { backgroundEvent } from '@background/background-events';
import {
  accountInfoReset,
  accountPendingDeployHashesChanged,
  accountPendingDeployHashesRemove,
  accountTrackingIdOfSentNftTokensChanged,
  accountTrackingIdOfSentNftTokensRemoved
} from '@background/redux/account-info/actions';
import {
  dismissAppEvent,
  dismissSagaError,
  resetAppEventsDismission
} from '@background/redux/app-events/actions';
import {
  contactRemoved,
  contactUpdated,
  contactsReseted,
  newContactAdded
} from '@background/redux/contacts/actions';
import {
  csprNameExpirationsUpdated,
  expiringCsprNamesDismissed
} from '@background/redux/cspr-name-expirations/actions';
import { MainStore } from '@background/redux/get-main-store';
import {
  closeLedgerFlowWindows,
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared,
  ledgerTransactionChanged
} from '@background/redux/ledger/actions';
import {
  askForReviewAfterChanged,
  ratedInStoreChanged,
  resetRateApp
} from '@background/redux/rate-app/actions';
import { ReduxAction } from '@background/redux/redux-action';
import {
  addWasmToTrusted,
  removeAllWasmFromTrustedOrigin,
  removeWasmFromTrusted,
  resetTrustedWasmState
} from '@background/redux/trusted-wasm/actions';
import {
  accountAdded,
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsAdded,
  accountsImported,
  activeAccountChanged,
  activeAccountSupportsChanged,
  addWatchingAccount,
  anotherAccountConnected,
  deploysReseted,
  hideAccountFromListChanged,
  secretPhraseCreated,
  siteConnected,
  siteDisconnected,
  vaultLoaded,
  vaultReseted
} from '@background/redux/vault/actions';
import {
  connectWindowInit,
  importWindowInit,
  onboardingAppInit,
  popupWindowInit,
  signWindowInit,
  windowRequestDeviceConfirmationChanged,
  windowRequestWindowAttached
} from '@background/redux/windowManagement/actions';

import { enableOnboardingFlow } from '../open-onboarding-flow';
import { keysReseted } from '../redux/keys/actions';
import { lastActivityTimeRefreshed } from '../redux/last-activity-time/actions';
import {
  recipientPublicKeyAdded,
  recipientPublicKeyReseted
} from '../redux/recent-recipient-public-keys/actions';
import {
  createAccount,
  initKeys,
  initVault,
  lockVault,
  openExportKeysWindow,
  recoverVault,
  resetVault
} from '../redux/sagas/actions';
import {
  contactEditingPermissionChanged,
  sessionReseted,
  vaultUnlocked
} from '../redux/session/actions';
import {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged,
  systemColorSchemeChanged,
  themeModeSettingChanged,
  vaultSettingsReseted
} from '../redux/settings/actions';
import { vaultCipherReseted } from '../redux/vault-cipher/actions';
import { attachWindowToRequest } from './attach-window-to-request';
import { handleCloseLedgerFlowWindows } from './close-ledger-flow-windows';
import {
  isTrustedUiSender,
  warnUntrustedSameExtensionSender
} from './trusted-sender';
import { HandlerResult } from './types';

// The request a sender page is displaying, read off its own URL — the same
// recovery `handleSdkResponseToTab` does for the dapp origin. Null when the page
// carries no id (the internal Ledger flows) or the URL will not parse.
function recoverRequestId(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).searchParams.get('requestId');
  } catch {
    return null;
  }
}

export const FORWARDED_ACTION_TYPES: ReadonlySet<string> = new Set(
  [
    lockVault,
    openExportKeysWindow,
    initKeys,
    initVault,
    recoverVault,
    createAccount,
    deploysReseted,
    sessionReseted,
    vaultUnlocked,
    vaultLoaded,
    vaultReseted,
    secretPhraseCreated,
    accountImported,
    accountsImported,
    accountAdded,
    accountsAdded,
    accountRemoved,
    accountRenamed,
    activeAccountChanged,
    activeAccountSupportsChanged,
    hideAccountFromListChanged,
    activeTimeoutDurationSettingChanged,
    activeNetworkSettingChanged,
    vaultSettingsReseted,
    themeModeSettingChanged,
    lastActivityTimeRefreshed,
    siteConnected,
    anotherAccountConnected,
    accountDisconnected,
    siteDisconnected,
    onboardingAppInit,
    popupWindowInit,
    connectWindowInit,
    importWindowInit,
    signWindowInit,
    vaultCipherReseted,
    keysReseted,
    recipientPublicKeyAdded,
    recipientPublicKeyReseted,
    accountInfoReset,
    accountPendingDeployHashesChanged,
    accountPendingDeployHashesRemove,
    accountTrackingIdOfSentNftTokensChanged,
    accountTrackingIdOfSentNftTokensRemoved,
    newContactAdded,
    contactRemoved,
    contactEditingPermissionChanged,
    contactUpdated,
    contactsReseted,
    ratedInStoreChanged,
    askForReviewAfterChanged,
    resetRateApp,
    ledgerNewWindowIdChanged,
    ledgerStateCleared,
    ledgerDeployChanged,
    ledgerTransactionChanged,
    ledgerRecipientToSaveOnSuccessChanged,
    addWatchingAccount,
    dismissAppEvent,
    resetAppEventsDismission,
    dismissSagaError,
    csprNameExpirationsUpdated,
    expiringCsprNamesDismissed,
    addWasmToTrusted,
    removeWasmFromTrusted,
    removeAllWasmFromTrustedOrigin,
    resetTrustedWasmState,
    systemColorSchemeChanged
  ].map(creator => creator.type)
);

export async function handleReduxAction(
  action: { type: string },
  sender: Runtime.MessageSender,
  store: MainStore
): Promise<HandlerResult> {
  // Intercepted rather than forwarded blindly: attaching a window is what makes
  // a request cancellable, so a dead or bogus `windowId` would leave it open
  // forever. `attachWindowToRequest` dispatches AND verifies the window is
  // alive, which the generic forwarding path cannot do. The UI dispatcher here
  // is `use-ledger` registering the Ledger permission window.
  if (windowRequestWindowAttached.match(action)) {
    // Defense-in-depth, same gate and same reasoning as `handleSdkResponseToTab`
    // and `handleLegacyImport`: this branch decides a request's lifecycle, so
    // only the extension's own UI pages may originate it. A live-but-unrelated
    // windowId makes the request permanently uncancellable; a dead one attached
    // in the gap before the real window makes `windowIds` exactly `[dead]`,
    // which the cancel path then selects. Already unreachable from a page via
    // the content script's SDK_REQUEST_TYPES allowlist — this is the layer that
    // does not depend on that allowlist staying right.
    // Silently drop (no response), matching the sibling gates.
    if (!isTrustedUiSender(sender)) {
      return { handled: true };
    }

    // `.match` is `isAction(action) && action.type === type` — it says nothing
    // about the payload. Read it defensively so a payload-less message reaches
    // `attachWindowToRequest`'s shape guard (which logs and drops it) instead
    // of throwing a TypeError the router reports as a generic sendError.
    const payload: Partial<{ requestId: string; windowId: number }> =
      action.payload ?? {};

    attachWindowToRequest(
      store,
      payload.requestId as string,
      payload.windowId as number
    );
    return { handled: true, response: undefined };
  }

  // Intercepted rather than forwarded even though it HAS a reducer case: it
  // decides whether the shared approval window may be reused while a Ledger
  // call runs in it, and `FORWARDED_ACTION_TYPES` checks no sender at all. Held
  // on a foreign request the flag withholds that request's window from reuse for
  // as long as it stays open, so the same two gates as the branches around it.
  if (windowRequestDeviceConfirmationChanged.match(action)) {
    if (!isTrustedUiSender(sender)) {
      return { handled: true };
    }

    // `.match` says nothing about the payload, and this crosses
    // `runtime.sendMessage`.
    const payload: Partial<{ requestId: string; awaiting: boolean }> =
      action.payload ?? {};

    // Bound to the sender's own URL exactly as `closeLedgerFlowWindows` is: the
    // page that runs the device call is the page the request opened, so it
    // carries the id in its query string. Unlike that one there is no
    // internal-flow case to admit — `runWithDeviceConfirmationReported` sends
    // nothing without a requestId.
    if (
      typeof payload.awaiting !== 'boolean' ||
      typeof payload.requestId !== 'string' ||
      payload.requestId !== recoverRequestId(sender.url)
    ) {
      return { handled: true };
    }

    store.dispatch(action as unknown as ReduxAction);
    return { handled: true, response: undefined };
  }

  // Intercepted rather than forwarded: there is no reducer case for it, and the
  // window set it closes is derived from `windowManagement.requests`, which no
  // replica can see. Gated on `sender` for the same reason as the branch above —
  // closing an approval window reaches `cancelOpenRequestsForClosedWindow`, so
  // this decides a request's lifecycle.
  if (closeLedgerFlowWindows.match(action)) {
    if (!isTrustedUiSender(sender)) {
      return { handled: true };
    }

    // `.match` says nothing about the payload, and this crosses
    // `runtime.sendMessage`. Read it defensively so a payload-less message
    // becomes the no-requestId (internal-flow) case instead of a TypeError the
    // router reports as a generic sendError.
    const payload: Partial<{ requestId: string; permissionWindowId: number }> =
      action.payload ?? {};

    // The sender gate admits every wallet page, so on its own it lets any of
    // them name any request — and this branch decides that request's lifecycle.
    // Every legitimate dispatcher runs in a window whose URL carries the id
    // (`use-ledger` builds the permission window's URL from the same params),
    // so binding the two costs nothing and drops the mismatch.
    if ((payload.requestId ?? null) !== recoverRequestId(sender.url)) {
      return { handled: true };
    }

    // The window id is the ownership proof; a message without one names
    // nothing the handler may close, so it is dropped rather than guessed at.
    if (typeof payload.permissionWindowId !== 'number') {
      console.warn(
        'closeLedgerFlowWindows: dropped — no permissionWindowId in the payload'
      );
      return { handled: true };
    }

    // Fire-and-forget: the dispatcher's document is one of the windows being
    // closed. `handleCloseLedgerFlowWindows` never rejects; the `.catch` is the
    // belt for a synchronous throw before its first await.
    void Promise.resolve(
      handleCloseLedgerFlowWindows(store, {
        requestId: payload.requestId,
        permissionWindowId: payload.permissionWindowId
      })
    ).catch(error =>
      console.error('closeLedgerFlowWindows: handler failed', error)
    );

    return { handled: true, response: undefined };
  }

  // Both branches below re-dispatch into the real store: the set carries
  // `initVault` and `keysReseted`, and `resetVault` reaches `storage.local.clear()`.
  // Gated like the two branches above, and for the same reason — so this does
  // not rest on the content script's request allowlist staying right. Scoped to
  // those two branches on purpose: an unlisted type must keep falling through
  // as `{ handled: false }`, which is how `handleBringWeb3` sees its
  // content-script messages at all.
  if (
    action.type === resetVault.type ||
    FORWARDED_ACTION_TYPES.has(action.type)
  ) {
    // Silently drop (no response), matching the sibling gates. Interpolating
    // `action.type` into the warning is safe only because this branch is
    // reached for a fixed vocabulary (resetVault plus FORWARDED_ACTION_TYPES) —
    // widen the branch and it becomes attacker-chosen console text.
    if (!isTrustedUiSender(sender)) {
      warnUntrustedSameExtensionSender(sender, `redux action ${action.type}`);
      return { handled: true };
    }
  }

  if (action.type === resetVault.type) {
    // The sender's OWN window, from `MessageSender` rather than the wire
    // payload — `ResetVaultPage` renders inside the signature-request and
    // connect-to-app approval windows (`LockedRouter`), so `resetVaultSaga`'s
    // window-removal set must exclude it: closing the window the reset was
    // issued FROM would kill the page's own continuation
    // (`closeWindowByReloadExtension`), and on Firefox/Safari that also skips
    // `runtime.reload()`. Absent for a non-tab sender, hence optional.
    store.dispatch(resetVault(sender.tab?.windowId));
    await enableOnboardingFlow();
    return { handled: true, response: undefined };
  }

  if (FORWARDED_ACTION_TYPES.has(action.type)) {
    store.dispatch(action as unknown as ReduxAction);
    return { handled: true, response: undefined };
  }

  if (backgroundEvent.popupStateUpdated.match(action)) {
    // do nothing — never respond (promise stays pending)
    return { handled: true };
  }

  return { handled: false };
}
