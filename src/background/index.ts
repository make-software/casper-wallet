import { getType, RootAction } from 'typesafe-actions';
import browser from 'webextension-polyfill';

import {
  CheckAccountNameIsTakenAction,
  CheckSecretKeyExistAction
} from '@src/background/redux/import-account-actions-should-be-removed';
import { isReduxAction } from '@src/background/redux/redux-action';
import { getMainStoreSingleton } from '@src/background/redux/utils';
import {
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsConnected,
  activeAccountChanged,
  activeOriginChanged,
  allAccountsDisconnected,
  timeoutDurationChanged,
  timeoutRefreshed,
  vaultCreated,
  vaultLocked,
  vaultReseted,
  vaultUnlocked
} from '@src/background/redux/vault/actions';
import {
  selectIsAnyAccountConnectedWithOrigin,
  selectVaultAccounts,
  selectVaultAccountsNames,
  selectVaultAccountsSecretKeysBase64,
  selectVaultActiveAccount,
  selectVaultIsLocked
} from '@src/background/redux/vault/selectors';
import {
  connectWindowInit,
  importWindowInit,
  popupWindowInit,
  windowIdChanged,
  windowIdCleared
} from '@src/background/redux/windowManagement/actions';
import { selectWindowId } from '@src/background/redux/windowManagement/selectors';
import { emitSdkEventToAllActiveTabs, sdkEvent } from '@src/content/sdk-event';
import { isSDKMessage, SdkMessage, sdkMessage } from '@src/content/sdk-message';
import { PurposeForOpening } from '@src/hooks';

import { openWindow } from './open-window';

browser.runtime.onInstalled.addListener(() => {
  // this will run on installation or update so
  // first clear previous rules, then register new rules
});

// two events at the same time start from the same storage state, will loose update
browser.runtime.onMessage.addListener(
  (action: RootAction | SdkMessage, sender) => {
    return new Promise(async sendResponse => {
      // Popup comms handling
      const store = await getMainStoreSingleton();

      if (isSDKMessage(action)) {
        console.error(`BACKEND SDK MESSAGE:`, JSON.stringify(action));

        switch (action.type) {
          case getType(sdkMessage.connectRequest): {
            let success = false;
            const accounts = selectVaultAccounts(store.getState());
            if (accounts.length > 0) {
              openWindow({
                purposeForOpening: PurposeForOpening.ConnectToApp,
                origin: action.payload
              });
              success = true;
            }
            sendResponse(sdkMessage.connectResponse(success, action.meta));
            break;
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
            sendResponse(sdkMessage.disconnectResponse(success, action.meta));
            break;
          }

          case getType(sdkMessage.isConnectedRequest): {
            const isConnected = selectIsAnyAccountConnectedWithOrigin(
              store.getState()
            );
            sendResponse(
              sdkMessage.isConnectedResponse(isConnected, action.meta)
            );
            break;
          }

          case getType(sdkMessage.getActivePublicKeyRequest): {
            const activeAccount = selectVaultActiveAccount(store.getState());
            sendResponse(
              sdkMessage.getActivePublicKeyResponse(
                activeAccount?.publicKey,
                action.meta
              )
            );
            break;
          }

          case getType(sdkMessage.getVersionRequest): {
            const manifestData = chrome.runtime.getManifest();
            // temporary WORKAROUND for cspr.live connect
            const version = '1.4.12' || manifestData.version;

            sendResponse(sdkMessage.getVersionResponse(version, action.meta));
            break;
          }

          default:
            throw Error(
              'Background: Unknown sdk message: ' + JSON.stringify(action)
            );
        }
      } else if (isReduxAction(action)) {
        console.error(`BACKEND REDUX ACTION:`, JSON.stringify(action));

        switch (action.type) {
          case getType(popupWindowInit):
          case getType(connectWindowInit):
          case getType(importWindowInit):
          case getType(windowIdChanged):
          case getType(windowIdCleared):
          case getType(vaultCreated):
          case getType(vaultReseted):
          case getType(vaultLocked):
          case getType(vaultUnlocked):
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
            // true will wait for store to update and emit event
            return true;

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
