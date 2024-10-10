import { RootAction, getType } from 'typesafe-actions';
import {
  Tabs,
  action,
  browserAction,
  management,
  runtime,
  tabs,
  windows
} from 'webextension-polyfill';

import {
  getUrlOrigin,
  hasHttpPrefix,
  isEqualCaseInsensitive
} from '@src/utils';

import { CasperDeploy } from '@signature-request/pages/sign-deploy/deploy-types';

import {
  backgroundEvent,
  popupStateUpdated
} from '@background/background-events';
import { WindowApp } from '@background/create-open-window';
import {
  disableOnboardingFlow,
  enableOnboardingFlow,
  openOnboardingUi
} from '@background/open-onboarding-flow';
import {
  accountInfoReset,
  accountPendingDeployHashesChanged,
  accountPendingDeployHashesRemove,
  accountTrackingIdOfSentNftTokensChanged,
  accountTrackingIdOfSentNftTokensRemoved
} from '@background/redux/account-info/actions';
import {
  contactRemoved,
  contactUpdated,
  contactsReseted,
  newContactAdded
} from '@background/redux/contacts/actions';
import { getExistingMainStoreSingletonOrInit } from '@background/redux/get-main-store';
import {
  CheckAccountNameIsTakenAction,
  CheckSecretKeyExistAction
} from '@background/redux/import-account-actions-should-be-removed';
import {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared
} from '@background/redux/ledger/actions';
import { setShowCSPRNamePromotion } from '@background/redux/promotion/actions';
import {
  askForReviewAfterChanged,
  ratedInStoreChanged
} from '@background/redux/rate-app/actions';
import {
  accountAdded,
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsAdded,
  accountsImported,
  activeAccountChanged,
  addWatchingAccount,
  anotherAccountConnected,
  deployPayloadReceived,
  deploysReseted,
  hideAccountFromListChanged,
  secretPhraseCreated,
  siteConnected,
  siteDisconnected,
  vaultLoaded,
  vaultReseted
} from '@background/redux/vault/actions';
import {
  selectAccountNamesByOriginDict,
  selectIsAccountConnected,
  selectVaultAccountsNames,
  selectVaultAccountsSecretKeysBase64,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';
import {
  connectWindowInit,
  importWindowInit,
  onboardingAppInit,
  popupWindowInit,
  signWindowInit,
  windowIdChanged,
  windowIdCleared
} from '@background/redux/windowManagement/actions';
import { selectWindowId } from '@background/redux/windowManagement/selectors';

import { SiteNotConnectedError, WalletLockedError } from '@content/sdk-errors';
import { sdkEvent } from '@content/sdk-event';
import { SdkMethod, isSDKMethod, sdkMethod } from '@content/sdk-method';

import {
  fetchOnRampOptionGet,
  fetchOnRampOptionPost,
  fetchOnRampSelectionPost
} from '@libs/services/buy-cspr-service';
import {
  fetchAuctionValidators,
  fetchValidatorsDetailsData
} from '@libs/services/validators-service';

import {
  CannotGetActiveAccountError,
  CannotGetSenderOriginError
} from './internal-errors';
import { openWindow } from './open-window';
import { activeOriginChanged } from './redux/active-origin/actions';
import { keysReseted, keysUpdated } from './redux/keys/actions';
import { selectKeysDoesExist } from './redux/keys/selectors';
import { lastActivityTimeRefreshed } from './redux/last-activity-time/actions';
import {
  loginRetryCountIncremented,
  loginRetryCountReseted
} from './redux/login-retry-count/actions';
import { loginRetryLockoutTimeSet } from './redux/login-retry-lockout-time/actions';
import {
  recipientPublicKeyAdded,
  recipientPublicKeyReseted
} from './redux/recent-recipient-public-keys/actions';
import {
  createAccount,
  initKeys,
  initVault,
  lockVault,
  recoverVault,
  resetVault,
  unlockVault
} from './redux/sagas/actions';
import {
  contactEditingPermissionChanged,
  encryptionKeyHashCreated,
  sessionReseted,
  vaultUnlocked
} from './redux/session/actions';
import { selectVaultIsLocked } from './redux/session/selectors';
import {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged,
  themeModeSettingChanged,
  vaultSettingsReseted
} from './redux/settings/actions';
import { selectApiConfigBasedOnActiveNetwork } from './redux/settings/selectors';
import {
  vaultCipherCreated,
  vaultCipherReseted
} from './redux/vault-cipher/actions';
import { selectVaultCipherDoesExist } from './redux/vault-cipher/selectors';
import { ServiceMessage, serviceMessage } from './service-message';
import { emitSdkEventToActiveTabsWithOrigin } from './utils';
// to resolve all repositories
import './wallet-repositories';

// setup default onboarding action
async function handleActionClick() {
  await openOnboardingUi();
}
action && action.onClicked.addListener(handleActionClick);
browserAction && browserAction.onClicked.addListener(handleActionClick);

async function isOnboardingCompleted() {
  const store = await getExistingMainStoreSingletonOrInit();
  const state = store.getState();

  const keysDoesExist = selectKeysDoesExist(state);
  const vaultCipherDoesExist = selectVaultCipherDoesExist(state);

  return keysDoesExist && vaultCipherDoesExist;
}

const init = () => {
  // check if onboarding is completed and then disable
  isOnboardingCompleted().then(yes => {
    if (yes) {
      disableOnboardingFlow();
    }
  });
};
runtime.onStartup.addListener(init);
management?.onEnabled?.addListener(init);

runtime.onInstalled.addListener(async () => {
  // this will run on installation or update so
  // first clear previous rules, then register new rules
  // DEV MODE: clean store on installation
  // storage.local.remove([REDUX_STORAGE_KEY]);
  //
  // after installation/update check if onboarding is completed
  isOnboardingCompleted().then(yes => {
    if (yes) {
      disableOnboardingFlow();
    } else {
      openOnboardingUi();
    }
  });
});

const updateOrigin = async (windowId: number) => {
  // skip when window lost focus
  if (windowId === -1) {
    return;
  }

  const window = await windows.get(windowId);
  // skip when non-normal windows
  if (window.type !== 'normal') {
    return;
  }

  const store = await getExistingMainStoreSingletonOrInit();
  const state = store.getState();
  const activeOrigin = state.activeOrigin;

  const activeTabs = await tabs.query({ active: true, windowId });
  const tab0 = activeTabs[0];

  let newActiveOrigin = null;
  // use only http based windows
  if (activeTabs.length === 1 && tab0.url && hasHttpPrefix(tab0.url)) {
    newActiveOrigin = getUrlOrigin(tab0.url) || null;
  }

  if (activeOrigin !== newActiveOrigin) {
    store.dispatch(activeOriginChanged(newActiveOrigin));

    const activeAccount = selectVaultActiveAccount(state);

    if (newActiveOrigin && activeAccount) {
      const isLocked = selectVaultIsLocked(state);
      const isActiveAccountConnected = selectIsAccountConnected(
        state,
        newActiveOrigin,
        activeAccount.name
      );

      emitSdkEventToActiveTabsWithOrigin(
        newActiveOrigin,
        sdkEvent.changedTab({
          isLocked: isLocked,
          isConnected: isLocked ? undefined : isActiveAccountConnected,
          activeKey:
            !isLocked && isActiveAccountConnected
              ? activeAccount.publicKey
              : undefined
        })
      );
    }
  }
};

windows.onFocusChanged.addListener(async (windowId: number) => {
  updateOrigin(windowId);
});

tabs.onActivated.addListener(
  async ({ windowId }: Tabs.OnActivatedActiveInfoType) => {
    updateOrigin(windowId);
  }
);

tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo && changeInfo.url && tab.windowId) {
    updateOrigin(tab.windowId);
  }
});

// NOTE: if two events are send at the same time (same function) it must reuse the same store instance
runtime.onMessage.addListener(
  async (
    action: RootAction | SdkMethod | ServiceMessage | popupStateUpdated,
    sender
  ) => {
    const store = await getExistingMainStoreSingletonOrInit();

    return new Promise(async (sendResponse, sendError) => {
      // Popup comms handling
      if (isSDKMethod(action)) {
        switch (action.type) {
          case getType(sdkMethod.connectRequest): {
            const origin = getUrlOrigin(sender.url);
            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }
            const activeAccount = selectVaultActiveAccount(store.getState());

            const query: Record<string, string> = {
              requestId: action.meta.requestId,
              origin: origin
            };
            if (action.payload.title != null) {
              query.title = action.payload.title;
            }
            const isAccountAlreadyConnected = selectIsAccountConnected(
              store.getState(),
              origin,
              activeAccount?.name
            );

            if (isAccountAlreadyConnected) {
              return sendResponse(sdkMethod.connectResponse(true, action.meta));
            } else {
              openWindow({
                windowApp: WindowApp.ConnectToApp,
                searchParams: query
              });
            }

            return sendResponse(undefined);
          }

          case getType(sdkMethod.switchAccountRequest): {
            const origin = getUrlOrigin(sender.url);
            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }

            const query: Record<string, string> = {
              requestId: action.meta.requestId,
              origin: origin
            };
            if (action.payload.title != null) {
              query.title = action.payload.title;
            }

            openWindow({
              windowApp: WindowApp.SwitchAccount,
              searchParams: query
            });

            return sendResponse(undefined);
          }

          case getType(sdkMethod.signRequest): {
            const origin = getUrlOrigin(sender.url);
            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }

            const { signingPublicKeyHex } = action.payload;
            let deployJson;
            try {
              deployJson = JSON.parse(action.payload.deployJson);
            } catch (err) {
              return sendError(Error('Desploy json string parse error'));
            }

            const deploy: CasperDeploy = deployJson.deploy;

            const isDeployAlreadySigningWithThisAccount = deploy.approvals.some(
              approvals =>
                isEqualCaseInsensitive(approvals.signer, signingPublicKeyHex)
            );

            if (isDeployAlreadySigningWithThisAccount) {
              return sendResponse(
                sdkMethod.signResponse(
                  {
                    cancelled: true,
                    message: 'This deploy already sign by this account'
                  },
                  { requestId: action.meta.requestId }
                )
              );
            }

            store.dispatch(
              deployPayloadReceived({
                id: action.meta.requestId,
                json: deployJson
              })
            );

            openWindow({
              windowApp: WindowApp.SignatureRequestDeploy,
              searchParams: {
                requestId: action.meta.requestId,
                signingPublicKeyHex
              }
            });

            return sendResponse(undefined);
          }

          case getType(sdkMethod.signMessageRequest): {
            const origin = getUrlOrigin(sender.url);
            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }

            const { signingPublicKeyHex, message } = action.payload;

            openWindow({
              windowApp: WindowApp.SignatureRequestMessage,
              searchParams: {
                requestId: action.meta.requestId,
                signingPublicKeyHex,
                message
              }
            });

            return sendResponse(undefined);
          }

          case getType(sdkMethod.disconnectRequest): {
            const origin = getUrlOrigin(sender.url);
            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }

            let success = false;

            const isLocked = selectVaultIsLocked(store.getState());

            const activeAccount = selectVaultActiveAccount(store.getState());
            if (activeAccount == null) {
              return sendError(CannotGetActiveAccountError());
            }
            const isActiveAccountConnected = selectIsAccountConnected(
              store.getState(),
              origin,
              activeAccount.name
            );

            emitSdkEventToActiveTabsWithOrigin(
              origin,
              sdkEvent.disconnectedAccountEvent({
                isLocked: isLocked,
                isConnected: isLocked ? undefined : false,
                activeKey:
                  !isLocked && isActiveAccountConnected
                    ? activeAccount.publicKey
                    : undefined
              })
            );
            store.dispatch(
              siteDisconnected({
                siteOrigin: origin
              })
            );
            success = true;

            return sendResponse(
              sdkMethod.disconnectResponse(success, action.meta)
            );
          }

          case getType(sdkMethod.isConnectedRequest): {
            const origin = getUrlOrigin(sender.url);
            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }

            const isLocked = selectVaultIsLocked(store.getState());
            if (isLocked) {
              return sendResponse(
                sdkMethod.isConnectedError(WalletLockedError(), action.meta)
              );
            }
            const accountNamesByOriginDict = selectAccountNamesByOriginDict(
              store.getState()
            );
            const isConnected = Boolean(origin in accountNamesByOriginDict);

            return sendResponse(
              sdkMethod.isConnectedResponse(isConnected, action.meta)
            );
          }

          case getType(sdkMethod.getActivePublicKeyRequest): {
            const origin = getUrlOrigin(sender.url);
            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }

            const isLocked = selectVaultIsLocked(store.getState());
            if (isLocked) {
              return sendResponse(
                sdkMethod.getActivePublicKeyError(
                  WalletLockedError(),
                  action.meta
                )
              );
            }

            const activeAccount = selectVaultActiveAccount(store.getState());
            if (activeAccount == null) {
              return sendError(CannotGetActiveAccountError());
            }

            const isConnected = selectIsAccountConnected(
              store.getState(),
              origin,
              activeAccount?.name
            );

            if (!isConnected) {
              return sendResponse(
                sdkMethod.getActivePublicKeyError(
                  SiteNotConnectedError(),
                  action.meta
                )
              );
            }

            return sendResponse(
              sdkMethod.getActivePublicKeyResponse(
                activeAccount.publicKey,
                action.meta
              )
            );
          }

          case getType(sdkMethod.getVersionRequest): {
            const manifestData = await chrome.runtime.getManifest();
            const version = manifestData.version;

            return sendResponse(
              sdkMethod.getVersionResponse(version, action.meta)
            );
          }

          default:
            throw Error(
              'Background: Unknown sdk message: ' + JSON.stringify(action)
            );
        }
      } else if (action.type != null) {
        switch (action.type) {
          case getType(resetVault): {
            store.dispatch(action);
            await enableOnboardingFlow();
            return sendResponse(undefined);
          }

          case getType(lockVault):
          case getType(unlockVault):
          case getType(initKeys):
          case getType(initVault):
          case getType(recoverVault):
          case getType(createAccount):
          case getType(deploysReseted):
          case getType(sessionReseted):
          case getType(encryptionKeyHashCreated):
          case getType(vaultUnlocked):
          case getType(vaultLoaded):
          case getType(vaultReseted):
          case getType(secretPhraseCreated):
          case getType(accountImported):
          case getType(accountsImported):
          case getType(accountAdded):
          case getType(accountsAdded):
          case getType(accountRemoved):
          case getType(accountRenamed):
          case getType(activeAccountChanged):
          case getType(hideAccountFromListChanged):
          case getType(activeTimeoutDurationSettingChanged):
          case getType(activeNetworkSettingChanged):
          case getType(vaultSettingsReseted):
          case getType(themeModeSettingChanged):
          case getType(lastActivityTimeRefreshed):
          case getType(siteConnected):
          case getType(anotherAccountConnected):
          case getType(accountDisconnected):
          case getType(siteDisconnected):
          case getType(windowIdChanged):
          case getType(windowIdCleared):
          case getType(onboardingAppInit):
          case getType(popupWindowInit):
          case getType(connectWindowInit):
          case getType(importWindowInit):
          case getType(signWindowInit):
          case getType(vaultCipherReseted):
          case getType(vaultCipherCreated):
          case getType(keysReseted):
          case getType(keysUpdated):
          case getType(loginRetryCountReseted):
          case getType(loginRetryCountIncremented):
          case getType(loginRetryLockoutTimeSet):
          case getType(recipientPublicKeyAdded):
          case getType(recipientPublicKeyReseted):
          case getType(accountInfoReset):
          case getType(accountPendingDeployHashesChanged):
          case getType(accountPendingDeployHashesRemove):
          case getType(accountTrackingIdOfSentNftTokensChanged):
          case getType(accountTrackingIdOfSentNftTokensRemoved):
          case getType(newContactAdded):
          case getType(contactRemoved):
          case getType(contactEditingPermissionChanged):
          case getType(contactUpdated):
          case getType(contactsReseted):
          case getType(ratedInStoreChanged):
          case getType(askForReviewAfterChanged):
          case getType(ledgerNewWindowIdChanged):
          case getType(ledgerStateCleared):
          case getType(ledgerDeployChanged):
          case getType(ledgerRecipientToSaveOnSuccessChanged):
          case getType(addWatchingAccount):
          case getType(setShowCSPRNamePromotion):
            store.dispatch(action);
            return sendResponse(undefined);

          case getType(backgroundEvent.popupStateUpdated):
            // do nothing
            return;

          // SERVICE MESSAGE HANDLERS
          case getType(serviceMessage.fetchAuctionValidatorsRequest): {
            const { casperClarityApiUrl } = selectApiConfigBasedOnActiveNetwork(
              store.getState()
            );

            try {
              const data = await fetchAuctionValidators({
                casperClarityApiUrl
              });

              return sendResponse(
                serviceMessage.fetchAuctionValidatorsResponse(data)
              );
            } catch (error) {
              console.error(error);
            }

            return;
          }

          case getType(serviceMessage.fetchValidatorsDetailsDataRequest): {
            const { casperClarityApiUrl } = selectApiConfigBasedOnActiveNetwork(
              store.getState()
            );

            try {
              const data = await fetchValidatorsDetailsData({
                casperClarityApiUrl,
                publicKey: action.payload.publicKey
              });

              return sendResponse(
                serviceMessage.fetchValidatorsDetailsDataResponse(data)
              );
            } catch (error) {
              console.error(error);
            }

            return;
          }

          case getType(serviceMessage.fetchOnRampGetOptionRequest): {
            try {
              const data = await fetchOnRampOptionGet();

              return sendResponse(
                serviceMessage.fetchOnRampGetOptionResponse(data)
              );
            } catch (error) {
              console.error(error);
            }

            return;
          }

          case getType(serviceMessage.fetchOnRampPostOptionRequest): {
            try {
              const data = await fetchOnRampOptionPost(action.payload);

              return sendResponse(
                serviceMessage.fetchOnRampPostOptionResponse(data)
              );
            } catch (error) {
              console.error(error);
            }

            return;
          }

          case getType(serviceMessage.fetchOnRampPostSelectionRequest): {
            try {
              const data = await fetchOnRampSelectionPost(action.payload);

              return sendResponse(
                serviceMessage.fetchOnRampPostSelectionResponse(data)
              );
            } catch (error) {
              console.error(error);
            }

            return;
          }

          // TODO: All below should be removed when Import Account is integrated with window
          case 'check-secret-key-exist' as any: {
            const { secretKeyBase64 } = (
              action as any as CheckSecretKeyExistAction
            ).payload;
            const vaultAccountsSecretKeysBase64 =
              selectVaultAccountsSecretKeysBase64(store.getState());

            const response = secretKeyBase64
              ? vaultAccountsSecretKeysBase64.includes(secretKeyBase64)
              : false;
            return sendResponse(response);
          }

          case 'check-account-name-is-taken' as any: {
            const { accountName } = (
              action as any as CheckAccountNameIsTakenAction
            ).payload;
            const vaultAccountsNames = selectVaultAccountsNames(
              store.getState()
            );
            const response = accountName
              ? vaultAccountsNames.includes(accountName)
              : false;
            return sendResponse(response);
          }

          case 'get-window-id' as any:
            const windowId = selectWindowId(store.getState());
            return sendResponse(windowId);

          default:
            throw Error(
              'Background: Unknown redux action: ' + JSON.stringify(action)
            );
        }
      } else {
        if (action === 'ping') {
          return;
        }
        throw Error('Background: Unknown message: ' + JSON.stringify(action));
      }
    });
  }
);

// ping mechanism to keep background script from destroing wallet session when it's unlocked
function ping() {
  runtime.sendMessage('ping').catch(() => {
    // ping
  });
}
setInterval(ping, 15000);
