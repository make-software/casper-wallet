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
  windowRequestWindowAttached
} from '@background/redux/windowManagement/actions';

import { enableOnboardingFlow } from '../open-onboarding-flow';
import { keysReseted, keysUpdated } from '../redux/keys/actions';
import { lastActivityTimeRefreshed } from '../redux/last-activity-time/actions';
import {
  loginRetryCountIncremented,
  loginRetryCountReseted
} from '../redux/login-retry-count/actions';
import { loginRetryLockoutTimeSet } from '../redux/login-retry-lockout-time/actions';
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
  resetVault,
  unlockVault
} from '../redux/sagas/actions';
import {
  contactEditingPermissionChanged,
  encryptionKeyHashCreated,
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
import {
  vaultCipherCreated,
  vaultCipherReseted
} from '../redux/vault-cipher/actions';
import { attachWindowToRequest } from './attach-window-to-request';
import { handleCloseLedgerFlowWindows } from './close-ledger-flow-windows';
import { isTrustedUiSender } from './private-state';
import { HandlerResult } from './types';

export const FORWARDED_ACTION_TYPES: ReadonlySet<string> = new Set(
  [
    lockVault,
    unlockVault,
    openExportKeysWindow,
    initKeys,
    initVault,
    recoverVault,
    createAccount,
    deploysReseted,
    sessionReseted,
    encryptionKeyHashCreated,
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
    vaultCipherCreated,
    keysReseted,
    keysUpdated,
    loginRetryCountReseted,
    loginRetryCountIncremented,
    loginRetryLockoutTimeSet,
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
    const payload: Partial<{ requestId: string }> = action.payload ?? {};

    // Fire-and-forget: the dispatcher's document is one of the windows being
    // closed. `handleCloseLedgerFlowWindows` never rejects; the `.catch` is the
    // belt for a synchronous throw before its first await.
    void Promise.resolve(
      handleCloseLedgerFlowWindows(store, payload.requestId)
    ).catch(error =>
      console.error('closeLedgerFlowWindows: handler failed', error)
    );

    return { handled: true, response: undefined };
  }

  if (action.type === resetVault.type) {
    store.dispatch(action as unknown as ReduxAction);
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
