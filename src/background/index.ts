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
  siteConnected,
  activeAccountChanged,
  siteDisconnected,
  vaultReseted,
  vaultLoaded,
  secretPhraseCreated,
  anotherAccountConnected,
  deployPayloadReceived,
  deploysReseted
} from '@src/background/redux/vault/actions';
import {
  selectIsAccountConnected,
  selectAccountNamesByOriginDict,
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
import { fetchAccountInfo } from '@libs/services/account-info';

import { openWindow } from './open-window';
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
import { emitSdkEventToActiveTabsWithOrigin } from './utils';
import { loginRetryLockoutTimeSet } from './redux/login-retry-lockout-time/actions';
import { lastActivityTimeRefreshed } from './redux/last-activity-time/actions';
import {
  activeNetworkSettingChanged,
  activeTimeoutDurationSettingChanged
} from './redux/settings/actions';
import { activeOriginChanged } from './redux/active-origin/actions';
import { selectApiConfigBasedOnActiveNetwork } from './redux/settings/selectors';
import { getUrlOrigin, hasHttpPrefix } from '@src/utils';
import {
  CannotGetActiveAccountError,
  CannotGetSenderOriginError
} from './internal-errors';
import {
  SiteNotConnectedError,
  WalletLockedError
} from '@src/content/sdk-errors';
import { recipientPublicKeyAdded } from './redux/recent-recipient-public-keys/actions';
import { fetchAccountTransactions } from '@libs/services/transactions-service';

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

const updateOrigin = async (windowId: number) => {
  // skip when window lost focus
  if (windowId === -1) {
    return;
  }

  const window = await browser.windows.get(windowId);
  // skip when non-normal windows
  if (window.type !== 'normal') {
    return;
  }

  const store = await getExistingMainStoreSingletonOrInit();
  const state = store.getState();
  const activeOrigin = state.activeOrigin;

  const activeTabs = await browser.tabs.query({ active: true, windowId });
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

browser.windows.onFocusChanged.addListener(async (windowId: number) => {
  updateOrigin(windowId);
});

browser.tabs.onActivated.addListener(
  async ({ windowId, tabId }: browser.Tabs.OnActivatedActiveInfoType) => {
    updateOrigin(windowId);
  }
);

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo && changeInfo.url && tab.windowId) {
    updateOrigin(tab.windowId);
  }
});

// NOTE: if two events are send at the same time (same function) it must reuse the same store instance
browser.runtime.onMessage.addListener(
  async (action: RootAction | SdkMethod | ServiceMessage, sender) => {
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
            store.dispatch(action);
            return sendResponse(undefined);

          // SERVICE MESSAGE HANDLERS
          case getType(serviceMessage.fetchBalanceRequest): {
            const { casperApiUrl } = selectApiConfigBasedOnActiveNetwork(
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
            const { casperApiUrl } = selectApiConfigBasedOnActiveNetwork(
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

          case getType(serviceMessage.fetchAccountTransactionsRequest): {
            const { casperApiUrl } = selectApiConfigBasedOnActiveNetwork(
              store.getState()
            );

            try {
              const { data: accountTransactions } =
                await fetchAccountTransactions({
                  accountHash: action.payload.accountHash,
                  casperApiUrl
                });

              return sendResponse(
                serviceMessage.fetchAccountTransactionsResponse(
                  accountTransactions
                )
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
