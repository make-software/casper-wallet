import { getType, RootAction } from 'typesafe-actions';
import browser from 'webextension-polyfill';

import {
  CheckAccountNameIsTakenAction,
  CheckSecretKeyExistAction
} from '@src/background/redux/import-account-actions-should-be-removed';
import { getMainStoreSingleton } from '@src/background/redux/utils';
import {
  accountAdded,
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsConnected,
  activeAccountChanged,
  allAccountsDisconnected,
  timeoutDurationChanged,
  vaultReseted,
  vaultLoaded,
  secretPhraseCreated
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
import { emitSdkEventToAllActiveTabs, sdkEvent } from '@src/content/sdk-event';
import { isSDKMessage, SdkMessage, sdkMessage } from '@src/content/sdk-message';
import { PurposeForOpening } from '@src/hooks';
import {
  enableOnboardingFlow,
  disableOnboardingFlow,
  openOnboardingUi
} from '@src/background/open-onboarding-flow';
import {
  getAccountBalance,
  getCurrencyRate
} from '@libs/services/balance-service';

import { openWindow } from './open-window';
import { deployPayloadReceived, deploysReseted } from './redux/deploys/actions';
import {
  activeOriginChanged,
  encryptionKeyHashCreated,
  lastActivityTimeRefreshed,
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
  loginRetryCountIncrement,
  loginRetryCountReseted
} from './redux/login-retry-count/actions';

// setup default onboarding action
async function handleActionClick() {
  await openOnboardingUi();
}
browser.action && browser.action.onClicked.addListener(handleActionClick);
browser.browserAction &&
  browser.browserAction.onClicked.addListener(handleActionClick);

async function isOnboardingCompleted() {
  const store = await getMainStoreSingleton();
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
browser.management.onEnabled.addListener(init);

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
  async (action: RootAction | SdkMessage | ServiceMessage, sender) => {
    const store = await getMainStoreSingleton();
    return new Promise(async (sendResponse, sendError) => {
      // Popup comms handling
      if (isSDKMessage(action)) {
        // console.warn(`BACKEND SDK MESSAGE:`, JSON.stringify(action));
        switch (action.type) {
          case getType(sdkMessage.connectRequest): {
            let success = false;

            const query: Record<string, string> = {
              origin: action.payload.origin
            };

            if (action.payload.title != null) {
              query.title = action.payload.title;
            }

            openWindow({
              purposeForOpening: PurposeForOpening.ConnectToApp,
              searchParams: query
            });
            success = true;

            return sendResponse(
              sdkMessage.connectResponse(success, action.meta)
            );
          }

          case getType(sdkMessage.disconnectRequest): {
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
              sdkMessage.disconnectResponse(success, action.meta)
            );
          }

          case getType(sdkMessage.signRequest): {
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
              purposeForOpening: PurposeForOpening.SignatureRequest,
              searchParams: {
                requestId: action.meta.requestId,
                signingPublicKeyHex
              }
            });

            return sendResponse(undefined);
          }

          case getType(sdkMessage.isConnectedRequest): {
            const isConnected = selectIsAnyAccountConnectedWithOrigin(
              store.getState()
            );

            return sendResponse(
              sdkMessage.isConnectedResponse(isConnected, action.meta)
            );
          }

          case getType(sdkMessage.getActivePublicKeyRequest): {
            const activeAccount = selectVaultActiveAccount(store.getState());

            return sendResponse(
              sdkMessage.getActivePublicKeyResponse(
                activeAccount?.publicKey,
                action.meta
              )
            );
          }

          case getType(sdkMessage.getVersionRequest): {
            const manifestData = await chrome.runtime.getManifest();
            const version = manifestData.version;

            return sendResponse(
              sdkMessage.getVersionResponse(version, action.meta)
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
          case getType(timeoutDurationChanged):
          case getType(lastActivityTimeRefreshed):
          case getType(accountsConnected):
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
          case getType(loginRetryCountIncrement):
            store.dispatch(action);
            return sendResponse(undefined);

          // SERVICE MESSAGE HANDLERS
          case getType(serviceMessage.fetchBalanceRequest): {
            try {
              const [balance, rate] = await Promise.all([
                getAccountBalance({ publicKey: action.payload.publicKey }),
                getCurrencyRate()
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
