import { bringInitBackground } from '@bringweb3/chrome-extension-kit';
import { Deploy, PublicKey } from 'casper-js-sdk';
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
  getActiveAccountSupports,
  getUrlOrigin,
  hasHttpPrefix,
  isChromeBuild,
  isEqualCaseInsensitive
} from '@src/utils';

import {
  backgroundEvent,
  popupStateUpdated
} from '@background/background-events';
import {
  BringWeb3Events,
  bringWeb3Events
} from '@background/bring-web3-events';
import { WindowApp } from '@background/create-open-window';
import { initKeepAlive } from '@background/keep-alive';
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
import { activeOriginFaviconChanged } from '@background/redux/active-origin-favicon/actions';
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
import { getExistingMainStoreSingletonOrInit } from '@background/redux/get-main-store';
import {
  CheckAccountNameIsTakenAction,
  CheckSecretKeyExistAction
} from '@background/redux/import-account-actions-should-be-removed';
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
import { ThemeMode } from '@background/redux/settings/types';
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

import { encryptAsHexWithCasperPublicKey } from '@libs/crypto';

import {
  CannotGetActiveAccountError,
  CannotGetSenderOriginError,
  ENCRYPT_MESSAGE_MAX_LENGTH
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
import { selectThemeModeSetting } from './redux/settings/selectors';
import {
  vaultCipherCreated,
  vaultCipherReseted
} from './redux/vault-cipher/actions';
import { selectVaultCipherDoesExist } from './redux/vault-cipher/selectors';
import {
  emitSdkEventToActiveTabs,
  emitSdkEventToActiveTabsWithOrigin
} from './utils';
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
    store.dispatch(activeOriginFaviconChanged(tab0.favIconUrl ?? null));

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
              : undefined,
          activeKeySupports:
            !isLocked && isActiveAccountConnected
              ? getActiveAccountSupports(activeAccount)
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
    action: RootAction | SdkMethod | popupStateUpdated | BringWeb3Events,
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

            const deploy: Deploy = deployJson.deploy;

            const isDeployAlreadySigningWithThisAccount =
              deploy?.approvals?.some(approvals =>
                isEqualCaseInsensitive(
                  approvals.signer.toString(),
                  signingPublicKeyHex
                )
              ) ?? false;

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

          case getType(sdkMethod.decryptMessageRequest): {
            const origin = getUrlOrigin(sender.url);

            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }

            const { signingPublicKeyHex, message } = action.payload;

            openWindow({
              windowApp: WindowApp.DecryptMessageRequest,
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
                    : undefined,
                activeKeySupports:
                  !isLocked && isActiveAccountConnected
                    ? getActiveAccountSupports(activeAccount)
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

          case getType(sdkMethod.getEncryptedMessageRequest): {
            const origin = getUrlOrigin(sender.url);

            const { signingPublicKeyHex, message = '' } = action.payload;

            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }

            try {
              PublicKey.fromHex(signingPublicKeyHex);
            } catch (e) {
              return sendError(Error('Public key hex is not valid'));
            }

            if (message.length > ENCRYPT_MESSAGE_MAX_LENGTH) {
              return sendError(
                Error(
                  `Message should be less than ${ENCRYPT_MESSAGE_MAX_LENGTH} symbols`
                )
              );
            }

            try {
              const encryptedMessage = await encryptAsHexWithCasperPublicKey(
                signingPublicKeyHex,
                message
              );

              return sendResponse(
                sdkMethod.getEncryptedMessageResponse(
                  {
                    encryptedMessage
                  },
                  action.meta
                )
              );
            } catch (e) {
              return sendError(Error('Error during message encryption'));
            }
          }

          case getType(sdkMethod.getActivePublicKeySupportsRequest): {
            const origin = getUrlOrigin(sender.url);

            if (!origin) {
              return sendError(CannotGetSenderOriginError());
            }

            const isLocked = selectVaultIsLocked(store.getState());

            if (isLocked) {
              return sendResponse(
                sdkMethod.getActivePublicKeySupportsError(
                  WalletLockedError(),
                  action.meta
                )
              );
            }

            const activeAccount = selectVaultActiveAccount(store.getState());

            if (!activeAccount) {
              return sendError(CannotGetActiveAccountError());
            }

            const isConnected = selectIsAccountConnected(
              store.getState(),
              origin,
              activeAccount?.name
            );

            if (!isConnected) {
              return sendResponse(
                sdkMethod.getActivePublicKeySupportsError(
                  SiteNotConnectedError(),
                  action.meta
                )
              );
            }

            const supports = getActiveAccountSupports(activeAccount);

            return sendResponse(
              sdkMethod.getActivePublicKeySupportsResponse(
                supports,
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
          case getType(activeAccountSupportsChanged):
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
          case getType(resetRateApp):
          case getType(ledgerNewWindowIdChanged):
          case getType(ledgerStateCleared):
          case getType(ledgerDeployChanged):
          case getType(ledgerTransactionChanged):
          case getType(ledgerRecipientToSaveOnSuccessChanged):
          case getType(addWatchingAccount):
          case getType(dismissAppEvent):
          case getType(resetAppEventsDismission):
          case getType(addWasmToTrusted):
          case getType(removeWasmFromTrusted):
          case getType(removeAllWasmFromTrustedOrigin):
          case getType(resetTrustedWasmState):
            store.dispatch(action);
            return sendResponse(undefined);

          case getType(backgroundEvent.popupStateUpdated):
            // do nothing
            return;

          case getType(bringWeb3Events.getActivePublicKey): {
            const activeAccount = selectVaultActiveAccount(store.getState());

            return sendResponse(
              bringWeb3Events.getActivePublicKeyResponse({
                publicKey: activeAccount?.publicKey!
              })
            );
          }

          case getType(bringWeb3Events.promptLoginRequest): {
            const isLocked = selectVaultIsLocked(store.getState());

            if (isLocked) {
              windows.getCurrent().then(currentWindow => {
                const windowWidth = currentWindow.width ?? 0;
                const xOffset = currentWindow.left ?? 0;
                const yOffset = currentWindow.top ?? 0;
                const popupWidth = 360;
                const popupHeight = 700;

                windows.create({
                  url: 'popup.html#/bring-web3-unlock',
                  type: 'popup',
                  height: popupHeight,
                  width: popupWidth,
                  left: windowWidth + xOffset - popupWidth,
                  top: yOffset,
                  focused: true
                });
              });
            } else {
              emitSdkEventToActiveTabs(tab => {
                if (!tab.url) {
                  return;
                }

                const activeAccount = selectVaultActiveAccount(
                  store.getState()
                );

                return sdkEvent.changedConnectedAccountEvent({
                  isLocked: isLocked,
                  isConnected: undefined,
                  activeKey: activeAccount?.publicKey,
                  activeKeySupports: activeAccount
                    ? getActiveAccountSupports(activeAccount)
                    : undefined
                });
              });
            }

            return sendResponse(undefined);
          }

          case getType(bringWeb3Events.getTheme): {
            const themeMode = selectThemeModeSetting(store.getState());

            const isDarkMode =
              // we can't get theme from system, so will use dark
              themeMode === ThemeMode.SYSTEM
                ? true
                : themeMode === ThemeMode.DARK;

            return sendResponse(
              bringWeb3Events.getThemeResponse({
                theme: isDarkMode ? 'dark' : 'light'
              })
            );
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
        if (action === 'keepAlive') {
          // Send an asynchronous response
          sendResponse({ status: 'alive' });

          // returning true to indicate an asynchronous response
          return true;
        }
        // this is added for not spamming with errors from bringweb3
        if ('from' in action) {
          // @ts-ignore
          if (action.from === 'bringweb3') {
            return;
          }
        }
        throw Error('Background: Unknown message: ' + JSON.stringify(action));
      }
    });
  }
);

initKeepAlive().catch(error => {
  console.error('Initialization of keep alive error:', error);
});

if (isChromeBuild) {
  bringInitBackground({
    identifier: process.env.PLATFORM_IDENTIFIER || '', // The identifier key you obtained from Bringweb3
    apiEndpoint: process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox',
    isEnabledByDefault: true
  });
}
