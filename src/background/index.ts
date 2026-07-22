import { bringInitBackground } from '@bringweb3/chrome-extension-kit';
import {
  Runtime,
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
  isChromeBuild
} from '@src/utils';

import { handleBringWeb3 } from '@background/handlers/bringweb3';
import { cancelOpenRequestsForClosedWindow } from '@background/handlers/cancel-open-requests-on-close';
import { handleLegacyImport } from '@background/handlers/legacy-import';
import {
  isPrivateStateRequest,
  isTrustedUiSender,
  selectPrivateState
} from '@background/handlers/private-state';
import { handleReduxAction } from '@background/handlers/redux-actions';
import { handleSdkMethod } from '@background/handlers/sdk-methods';
import { handleSdkResponseToTab } from '@background/handlers/sdk-response-to-tab';
import { initKeepAlive } from '@background/keep-alive';
import {
  disableOnboardingFlow,
  openOnboardingUi
} from '@background/open-onboarding-flow';
import { activeOriginFaviconChanged } from '@background/redux/active-origin-favicon/actions';
import { getExistingMainStoreSingletonOrInit } from '@background/redux/get-main-store';
import {
  selectIsAccountConnected,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';
import { exportKeysWindowIdCleared } from '@background/redux/windowManagement/actions';
import {
  selectExportKeysWindowId,
  selectWindowId
} from '@background/redux/windowManagement/selectors';

import { sdkEvent } from '@content/sdk-event';
import { isSDKMethod } from '@content/sdk-method';

import { activeOriginChanged } from './redux/active-origin/actions';
import { selectKeysDoesExist } from './redux/keys/selectors';
import { selectVaultIsLocked } from './redux/session/selectors';
import { selectVaultCipherDoesExist } from './redux/vault-cipher/selectors';
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

// Single init-time listener for the approval-window lifecycle. Replaces the
// per-creation `windows.onRemoved` listeners that used to be added inside
// `createOpenWindow` (one leaked per opened window). `windows.onRemoved` fires
// for ANY window, so the id-match guard ensures we only react when the removed
// window is the tracked approval window. `cancelOpenRequestsForClosedWindow`
// waits a grace period, then cancels any requests still open for that window
// and dispatches `windowIdCleared` to null the slice `windowId`.
windows.onRemoved.addListener(async (removedWindowId: number) => {
  const store = await getExistingMainStoreSingletonOrInit();
  if (removedWindowId === selectWindowId(store.getState())) {
    await cancelOpenRequestsForClosedWindow(store, removedWindowId);
  }
  if (removedWindowId === selectExportKeysWindowId(store.getState())) {
    store.dispatch(exportKeysWindowIdCleared());
  }
});

// NOTE: if two events are send at the same time (same function) it must reuse the same store instance
// Thin router: parse → route → delegate. All business logic lives in
// `@background/handlers/*`; each handler returns a `HandlerResult`:
//   { handled: false }                   → try the next handler
//   { handled: true }                    → handled, never respond (promise
//                                           stays pending — e.g. popupStateUpdated)
//   { handled: true, response: <value> } → handled, sendResponse(value)
// A thrown error becomes sendError(error).
runtime.onMessage.addListener(
  async (message: unknown, sender: Runtime.MessageSender) => {
    const store = await getExistingMainStoreSingletonOrInit();

    return new Promise(async (sendResponse, sendError) => {
      // A handled result either carries a `response` (→ sendResponse) or not
      // (→ leave the promise pending). Centralized so all handler call sites
      // route their result identically.
      const respond = (result: { response?: unknown }) =>
        'response' in result ? sendResponse(result.response) : undefined;

      try {
        if (message === 'keepAlive') {
          return sendResponse({ status: 'alive' });
        }

        const action = message as { type?: unknown; from?: unknown };

        if (isSDKMethod(action)) {
          const result = await handleSdkMethod(action, sender, store);
          if (result.handled) {
            return respond(result);
          }
          throw Error(
            'Background: Unknown sdk message: ' + JSON.stringify(action)
          );
        }

        // Must stay AFTER the isSDKMethod branch: a page-crafted message with
        // this type and meta.requestId passes the content-script relay filter
        // and has to be captured (and rejected) by the SDK branch first
        if (isPrivateStateRequest(action)) {
          if (!isTrustedUiSender(sender)) {
            if (sender.id === runtime.id) {
              // Same-extension sender rejected by the URL-prefix check —
              // distinguishes a legitimate-but-unrecognized UI origin
              // (packaging variant, sandboxed frame) from a probing sender.
              // Origin only: a content-script sender's full page URL could
              // carry tokens in query strings
              const senderOrigin =
                sender.url != null ? new URL(sender.url).origin : undefined;
              console.warn(
                'Background: private-state request from same-extension sender rejected by URL check:',
                senderOrigin
              );
            }
            // No data (and no error detail) for untrusted senders
            return;
          }
          return sendResponse(selectPrivateState(store.getState()));
        }

        if (typeof action.type === 'string') {
          const typedAction = action as { type: string };

          for (const handle of [handleReduxAction, handleBringWeb3] as const) {
            const result = await handle(typedAction, store);
            if (result.handled) {
              return respond(result);
            }
          }

          // SDK-response reroute is gated on `sender` (only extension UI may
          // originate it), so it is called outside the uniform loop above.
          const sdkResponseResult = await handleSdkResponseToTab(
            typedAction,
            sender,
            store
          );
          if (sdkResponseResult.handled) {
            return respond(sdkResponseResult);
          }

          // Legacy import handler is gated on `sender` (P0.1), so it is called
          // outside the uniform loop above.
          const legacyResult = handleLegacyImport(typedAction, sender, store);
          if (legacyResult.handled) {
            return respond(legacyResult);
          }

          throw Error(
            'Background: Unknown redux action: ' + JSON.stringify(action)
          );
        }

        // this is added for not spamming with errors from bringweb3
        if (action?.from === 'bringweb3') {
          return;
        }

        throw Error('Background: Unknown message: ' + JSON.stringify(action));
      } catch (error) {
        return sendError(error);
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
