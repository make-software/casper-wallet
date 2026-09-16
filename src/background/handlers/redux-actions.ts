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
  ledgerSwapPayloadChanged,
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
  swapDeadlineSettingChanged,
  swapSlippageSettingChanged,
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
    swapSlippageSettingChanged,
    swapDeadlineSettingChanged,
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
    ledgerSwapPayloadChanged,
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
  // Intercepted rather than forwarded blindly: `attachWindowToRequest` also
  // verifies the window is alive, which the forwarding path cannot do.
  if (windowRequestWindowAttached.match(action)) {
    // Only the extension's own UI may decide a request's lifecycle: a foreign
    // windowId leaves the request permanently uncancellable. Dropped silently.
    if (!isTrustedUiSender(sender)) {
      return { handled: true };
    }

    // `.match` says nothing about the payload; read it defensively so a
    // payload-less message reaches `attachWindowToRequest`'s shape guard.
    const payload: Partial<{ requestId: string; windowId: number }> =
      action.payload ?? {};

    attachWindowToRequest(
      store,
      payload.requestId as string,
      payload.windowId as number
    );
    return { handled: true, response: undefined };
  }

  // Intercepted though it has a reducer case: held on a foreign request the flag
  // withholds that request's window from reuse for as long as it stays open.
  if (windowRequestDeviceConfirmationChanged.match(action)) {
    if (!isTrustedUiSender(sender)) {
      return { handled: true };
    }

    const payload: Partial<{ requestId: string; awaiting: boolean }> =
      action.payload ?? {};

    // Bound to the sender's own URL: the page that runs the device call is the
    // page the request opened, so it carries the id in its query string.
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

  // Intercepted rather than forwarded: no reducer case, and the window set it
  // closes derives from `windowManagement.requests`, which no replica can see.
  if (closeLedgerFlowWindows.match(action)) {
    if (!isTrustedUiSender(sender)) {
      return { handled: true };
    }

    // Read defensively so a payload-less message becomes the no-requestId
    // (internal-flow) case instead of a TypeError.
    const payload: Partial<{ requestId: string; permissionWindowId: number }> =
      action.payload ?? {};

    // The sender gate admits every wallet page, so bind the named request to the
    // id in the sender's own URL — every legitimate dispatcher carries it.
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
    // closed. The `.catch` covers a synchronous throw before the first await.
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

  // Gated because both branches below re-dispatch into the real store; scoped to
  // them so an unlisted type still falls through for `handleBringWeb3`.
  if (
    action.type === resetVault.type ||
    FORWARDED_ACTION_TYPES.has(action.type)
  ) {
    // Interpolating `action.type` is safe only because this branch is reached
    // for a fixed vocabulary — widen it and it becomes attacker-chosen text.
    if (!isTrustedUiSender(sender)) {
      warnUntrustedSameExtensionSender(sender, `redux action ${action.type}`);
      return { handled: true };
    }
  }

  if (action.type === resetVault.type) {
    // The sender's OWN window, so `resetVaultSaga` excludes it from removal:
    // closing it would kill the page's own continuation.
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
