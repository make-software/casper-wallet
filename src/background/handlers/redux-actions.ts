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
  resetAppEventsDismission
} from '@background/redux/app-events/actions';
import {
  contactRemoved,
  contactUpdated,
  contactsReseted,
  newContactAdded
} from '@background/redux/contacts/actions';
import { MainStore } from '@background/redux/get-main-store';
import {
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
  windowIdChanged,
  windowIdCleared
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
import { HandlerResult } from './types';

export const FORWARDED_ACTION_TYPES: ReadonlySet<string> = new Set(
  [
    lockVault,
    unlockVault,
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
    windowIdChanged,
    windowIdCleared,
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
    addWasmToTrusted,
    removeWasmFromTrusted,
    removeAllWasmFromTrustedOrigin,
    resetTrustedWasmState,
    systemColorSchemeChanged
  ].map(creator => creator.type)
);

export async function handleReduxAction(
  action: { type: string },
  store: MainStore
): Promise<HandlerResult> {
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
