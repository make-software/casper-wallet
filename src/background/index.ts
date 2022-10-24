import { getType, RootAction } from 'typesafe-actions';
import browser from 'webextension-polyfill';

import {
  CheckAccountNameIsTakenAction,
  CheckSecretKeyExistAction
} from '@src/background/redux/import-account-actions-should-be-removed';
import { isReduxAction } from '@src/background/redux/redux-action';
import { getMainStoreSingleton } from '@src/background/redux/utils';
import {
  accountCreated,
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsConnected,
  activeAccountChanged,
  activeOriginChanged,
  allAccountsDisconnected,
  secretPhraseCreated,
  timeoutDurationChanged,
  timeoutRefreshed,
  vaultCreated,
  vaultLocked,
  vaultReseted,
  vaultUnlocked
} from '@src/background/redux/vault/actions';
import {
  selectVaultCountOfAccounts,
  selectIsActiveAccountConnectedWithOrigin,
  selectIsAnyAccountConnectedWithOrigin,
  selectVaultAccountsNames,
  selectVaultAccountsSecretKeysBase64,
  selectVaultActiveAccount,
  selectVaultIsLocked,
  selectVaultHasAccount,
  selectVaultDoesExist
} from '@src/background/redux/vault/selectors';
import {
  connectWindowInit,
  importWindowInit,
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

import { openWindow } from './open-window';
import { deployPayloadReceived } from './redux/deploys/actions';

browser.runtime.onInstalled.addListener(async () => {
  // this will run on installation or update so
  // first clear previous rules, then register new rules
  // DEV MODE: clean store on installation
  // browser.storage.local.remove([REDUX_STORAGE_KEY]);

  const store = await getMainStoreSingleton();
  const state = store.getState();

  const vaultDoesExists = selectVaultDoesExist(state);
  const vaultHasAccount = selectVaultHasAccount(state);

  if (!vaultDoesExists || !vaultHasAccount) {
    await openOnboardingUi();
  } else {
    await disableOnboardingFlow();
  }
});

async function handleActionClick() {
  await openOnboardingUi();
}

browser.action && browser.action.onClicked.addListener(handleActionClick);
browser.browserAction &&
  browser.browserAction.onClicked.addListener(handleActionClick);

// NOTE: if two events are send at the same time (same function) it must reuse the same store instance
browser.runtime.onMessage.addListener(
  async (action: RootAction | SdkMessage, sender) => {
    const store = await getMainStoreSingleton();
    return new Promise(async (sendResponse, sendError) => {
      // Popup comms handling
      if (isSDKMessage(action)) {
        // console.warn(`BACKEND SDK MESSAGE:`, JSON.stringify(action));

        switch (action.type) {
          case getType(sdkMessage.connectRequest): {
            let success = false;
            const isLocked = selectVaultIsLocked(store.getState());
            const countOfAccounts = selectVaultCountOfAccounts(
              store.getState()
            );

            if (!isLocked && countOfAccounts > 0) {
              const query: Record<string, string> = {
                origin: action.payload.origin
              };

              if (action.payload.title != null) {
                query.title = action.payload.title;
              }

              openWindow({
                purposeForOpening: PurposeForOpening.ConnectToApp,
                query
              });
              success = true;
            }

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
                sdkEvent.disconnectedActiveAccountEvent({
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
            const isActiveAccountConnected =
              selectIsActiveAccountConnectedWithOrigin(store.getState());

            // TODO PIOTR: Not connected error should be shown on every SDK call
            // need to design a global error handling
            if (!isActiveAccountConnected) {
              return sendError('Active account not connected.');
            }

            let deployJson;
            try {
              deployJson = JSON.parse(action.payload.deployJson);
            } catch (err) {
              return sendError('Deploy json string parse error');
            }

            store.dispatch(
              deployPayloadReceived({
                id: action.meta.requestId,
                json: deployJson
              })
            );
            openWindow({
              purposeForOpening: PurposeForOpening.SignatureRequest,
              query: {
                requestId: action.meta.requestId
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
            const manifestData = chrome.runtime.getManifest();
            // temporary WORKAROUND for cspr.live connect
            const version = '1.4.12' || manifestData.version;

            return sendResponse(
              sdkMessage.getVersionResponse(version, action.meta)
            );
          }

          default:
            throw Error(
              'Background: Unknown sdk message: ' + JSON.stringify(action)
            );
        }
      } else if (isReduxAction(action)) {
        // console.warn(`BACKEND REDUX ACTION:`, JSON.stringify(action));

        switch (action.type) {
          case getType(vaultReseted): {
            store.dispatch(action);
            await enableOnboardingFlow();
            return sendResponse(undefined);
          }

          case getType(popupWindowInit):
          case getType(connectWindowInit):
          case getType(importWindowInit):
          case getType(signWindowInit):
          case getType(windowIdChanged):
          case getType(windowIdCleared):
          case getType(vaultCreated):
          case getType(vaultLocked):
          case getType(vaultUnlocked):
          case getType(secretPhraseCreated):
          case getType(accountCreated):
          case getType(accountImported):
          case getType(accountRemoved):
          case getType(accountRenamed):
          case getType(activeOriginChanged):
          case getType(activeAccountChanged):
          case getType(timeoutDurationChanged):
          case getType(timeoutRefreshed):
          case getType(accountsConnected):
          case getType(accountDisconnected):
          case getType(allAccountsDisconnected):
            store.dispatch(action);
            return sendResponse(undefined);

          // All below should be removed when Import Account is integrated with window
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
