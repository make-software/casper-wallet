import { getType, RootAction } from 'typesafe-actions';
import browser from 'webextension-polyfill';

import {
  CheckAccountNameIsTakenAction,
  CheckSecretKeyExistAction
} from '@src/background/redux/import-account-actions-should-be-removed';
import { getExistingMainStoreSingletonOrInit } from '@src/background/redux/utils';
import {
  accountAdded,
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsConnected,
  activeAccountChanged,
  allAccountsDisconnected,
  vaultReseted,
  vaultLoaded,
  secretPhraseCreated,
  accountConnected
} from '@src/background/redux/vault/actions';
import {
  selectIsActiveAccountConnectedWithOrigin,
  selectIsAnyAccountConnectedWithOrigin,
  selectVaultAccountsNames,
  selectVaultAccountsSecretKeysBase64,
  selectVaultActiveAccount
} from '@src/background/redux/vault/selectors';
import {
  connectWindowInit,
  importWindowInit,
  onboardingAppInit,
  popupWindowInit,
  signWindowInit,
  windowIdChanged,
  windowIdCleared
} from '@src/background/redux/windowManagement/actions';
import { selectWindowId } from '@src/background/redux/windowManagement/selectors';
import { sdkEvent } from '@src/content/sdk-event';
import { isSDKMethod, SdkMethod, sdkMethod } from '@src/content/sdk-method';
import { WindowApp } from '@src/hooks';
import {
  enableOnboardingFlow,
  disableOnboardingFlow,
  openOnboardingUi
} from '@src/background/open-onboarding-flow';
import {
  fetchAccountBalance,
  fetchCurrencyRate
} from '@libs/services/balance-service';
import {
  fetchAccountInfo,
  fetchAccountListInfo
} from '@libs/services/account-info';

import { openWindow } from './open-window';
import { deployPayloadReceived, deploysReseted } from './redux/deploys/actions';
import {
  encryptionKeyHashCreated,
  sessionReseted,
  vaultUnlocked
} from './redux/session/actions';
import {
  createAccount,
  initKeys,
  initVault,
  lockVault,
  resetVault,
  unlockVault
} from './redux/sagas/actions';
import {
  vaultCipherCreated,
  vaultCipherReseted
} from './redux/vault-cipher/actions';
import { keysReseted, keysUpdated } from './redux/keys/actions';
import { selectVaultIsLocked } from './redux/session/selectors';
import { selectKeysDoesExist } from './redux/keys/selectors';
import { selectVaultCipherDoesExist } from './redux/vault-cipher/selectors';
import { ServiceMessage, serviceMessage } from './service-message';
import {
  loginRetryCountIncremented,
  loginRetryCountReseted
} from './redux/login-retry-count/actions';
import { emitSdkEventToAllActiveTabs } from './emit-sdk-event-to-all-active-tabs';
import { loginRetryLockoutTimeSet } from './redux/login-retry-lockout-time/actions';
import { lastActivityTimeRefreshed } from './redux/last-activity-time/actions';
import {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged
} from './redux/settings/actions';
import { activeOriginChanged } from './redux/active-origin/actions';
import { selectCasperUrlsBaseOnActiveNetworkSetting } from './redux/settings/selectors';

// setup default onboarding action
async function handleActionClick() {
  await openOnboardingUi();
}
browser.action && browser.action.onClicked.addListener(handleActionClick);
browser.browserAction &&
  browser.browserAction.onClicked.addListener(handleActionClick);

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
browser.runtime.onStartup.addListener(init);
browser.management?.onEnabled?.addListener(init);

browser.runtime.onInstalled.addListener(async () => {
  // console.log('installed');
  // this will run on installation or update so
  // first clear previous rules, then register new rules
  // DEV MODE: clean store on installation
  // browser.storage.local.remove([REDUX_STORAGE_KEY]);
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

// NOTE: if two events are send at the same time (same function) it must reuse the same store instance
browser.runtime.onMessage.addListener(
  async (action: RootAction | SdkMethod | ServiceMessage, sender) => {
    const store = await getExistingMainStoreSingletonOrInit();
    return new Promise(async (sendResponse, sendError) => {
      // Popup comms handling
      if (isSDKMethod(action)) {
        // console.warn(`BACKEND SDK MESSAGE:`, JSON.stringify(action));
        switch (action.type) {
          case getType(sdkMethod.connectRequest): {
            const query: Record<string, string> = {
              requestId: action.meta.requestId,
              origin: action.payload.origin
            };
            if (action.payload.title != null) {
              query.title = action.payload.title;
            }

            const isActiveAccountConnected =
              selectIsActiveAccountConnectedWithOrigin(store.getState());
            if (isActiveAccountConnected) {
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
            const query: Record<string, string> = {
              requestId: action.meta.requestId,
              origin: action.payload.origin
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
            const { signingPublicKeyHex } = action.payload;
            let deployJson;
            try {
              deployJson = JSON.parse(action.payload.deployJson);
            } catch (err) {
              return sendError(Error('Desploy json string parse error'));
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
            let success = false;

            const isLocked = selectVaultIsLocked(store.getState());
            const activeAccount = selectVaultActiveAccount(store.getState());

            if (activeAccount) {
              emitSdkEventToAllActiveTabs(
                sdkEvent.disconnectedAccountEvent({
                  isConnected: false,
                  isLocked: isLocked,
                  activeKey: activeAccount?.publicKey
                })
              );
              store.dispatch(
                allAccountsDisconnected({
                  siteOrigin: action.payload
                })
              );
              success = true;
            }

            return sendResponse(
              sdkMethod.disconnectResponse(success, action.meta)
            );
          }

          case getType(sdkMethod.isConnectedRequest): {
            const isConnected = selectIsAnyAccountConnectedWithOrigin(
              store.getState()
            );

            return sendResponse(
              sdkMethod.isConnectedResponse(isConnected, action.meta)
            );
          }

          case getType(sdkMethod.getActivePublicKeyRequest): {
            const activeAccount = selectVaultActiveAccount(store.getState());

            return sendResponse(
              sdkMethod.getActivePublicKeyResponse(
                activeAccount?.publicKey,
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
        // console.warn(`BACKEND REDUX ACTION:`, JSON.stringify(action));
        switch (action.type) {
          case getType(resetVault): {
            store.dispatch(action);
            await enableOnboardingFlow();
            return sendResponse(undefined);
          }

          case getType(activeOriginChanged): {
            store.dispatch(action);

            const isActiveAccountConnected =
              selectIsActiveAccountConnectedWithOrigin(store.getState());
            const isLocked = selectVaultIsLocked(store.getState());
            const activeAccount = selectVaultActiveAccount(store.getState());
            if (activeAccount) {
              emitSdkEventToAllActiveTabs(
                sdkEvent.changedTab({
                  isLocked: isLocked,
                  isConnected: isActiveAccountConnected,
                  activeKey:
                    isActiveAccountConnected && !isLocked
                      ? activeAccount.publicKey
                      : null
                })
              );
            }

            return sendResponse(undefined);
          }

          case getType(lockVault):
          case getType(unlockVault):
          case getType(initKeys):
          case getType(initVault):
          case getType(createAccount):
          case getType(deploysReseted):
          case getType(sessionReseted):
          case getType(encryptionKeyHashCreated):
          case getType(vaultUnlocked):
          case getType(vaultLoaded):
          case getType(vaultReseted):
          case getType(secretPhraseCreated):
          case getType(accountImported):
          case getType(accountAdded):
          case getType(accountRemoved):
          case getType(accountRenamed):
          case getType(activeAccountChanged):
          case getType(activeTimeoutDurationSettingChanged):
          case getType(activeNetworkSettingChanged):
          case getType(lastActivityTimeRefreshed):
          case getType(accountsConnected):
          case getType(accountConnected):
          case getType(accountDisconnected):
          case getType(allAccountsDisconnected):
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
            store.dispatch(action);
            return sendResponse(undefined);

          // SERVICE MESSAGE HANDLERS
          case getType(serviceMessage.fetchBalanceRequest): {
            const { casperApiUrl } = selectCasperUrlsBaseOnActiveNetworkSetting(
              store.getState()
            );

            try {
              const [balance, rate] = await Promise.all([
                fetchAccountBalance({
                  publicKey: action.payload.publicKey,
                  casperApiUrl
                }),
                fetchCurrencyRate({ casperApiUrl })
              ]);

              return sendResponse(
                serviceMessage.fetchBalanceResponse({
                  balance: balance?.data || null,
                  currencyRate: rate?.data || null
                })
              );
            } catch (error) {
              console.error(error);
            }

            return;
          }

          case getType(serviceMessage.fetchAccountInfoRequest): {
            const { casperApiUrl } = selectCasperUrlsBaseOnActiveNetworkSetting(
              store.getState()
            );

            try {
              const { data: accountInfo } = await fetchAccountInfo({
                accountHash: action.payload.accountHash,
                casperApiUrl
              });

              return sendResponse(
                serviceMessage.fetchAccountInfoResponse(accountInfo)
              );
            } catch (error) {
              console.error(error);
            }

            return;
          }

          case getType(serviceMessage.fetchAccountListInfoRequest): {
            const { casperApiUrl } = selectCasperUrlsBaseOnActiveNetworkSetting(
              store.getState()
            );

            try {
              const { data: accountsInfoList } = await fetchAccountListInfo({
                accountsHash: action.payload.accountsHash,
                casperApiUrl
              });

              return sendResponse(
                serviceMessage.fetchAccountListInfoResponse(accountsInfoList)
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
        throw Error('Background: Unknown message: ' + JSON.stringify(action));
      }
    });
  }
);

// ping mechanism to keep background script from destroing wallet session when it's unlocked
function ping() {
  browser.runtime.sendMessage('ping').catch(err => {
    // ping
  });
}
setInterval(ping, 5000);
