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
import { handleLegacyImport } from '@background/handlers/legacy-import';
import {
  isPrivateStateRequest,
  isTrustedUiSender,
  selectPrivateState,
  warnUntrustedSameExtensionSender
} from '@background/handlers/private-state';
import { handleReduxAction } from '@background/handlers/redux-actions';
import { handleSdkMethod } from '@background/handlers/sdk-methods';
import { handleSdkResponseToTab } from '@background/handlers/sdk-response-to-tab';
import {
  unknownMessageError,
  unknownReduxActionError,
  unknownSdkMessageError
} from '@background/handlers/unknown-message-errors';
import { handleWindowRemoved } from '@background/handlers/window-removed';
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

import { sdkEvent } from '@content/sdk-event';
import { isSDKMethod } from '@content/sdk-method';

import { activeOriginChanged } from './redux/active-origin/actions';
import { selectKeysDoesExist } from './redux/keys/selectors';
import { selectVaultIsLocked } from './redux/session/selectors';
import { selectVaultCipherDoesExist } from './redux/vault-cipher/selectors';
// to resolve all repositories — the signing pair lives in its own module so that the page
// entries, which only read data, do not link casper-js-sdk through it
import './signing-repositories';
import { emitSdkEventToActiveTabsWithOrigin } from './utils';
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
// for ANY window; `handleWindowRemoved` itself decides whether the removed
// window was the last display for any open request (a request the Ledger
// permission window still shows survives), waits a grace period, then cancels
// the survivors, nulls the slice `windowId` if it is still tracking the removed
// window, and clears the tracked export-keys id.
//
// The body lives in a handler so it can be tested — this entry point is
// imported by no test. Only the store init is left here, and its rejection is
// caught: `getExistingMainStoreSingletonOrInit` can reject, and `void` on a
// bare IIFE would discard that with no `unhandledrejection` handler anywhere.
windows.onRemoved.addListener((removedWindowId: number) => {
  void (async () => {
    const store = await getExistingMainStoreSingletonOrInit();
    await handleWindowRemoved(store, removedWindowId);
  })().catch(error => console.error('windows.onRemoved handler failed', error));
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
          throw unknownSdkMessageError(action);
        }

        // Must stay AFTER the isSDKMethod branch: a page-crafted message with
        // this type and meta.requestId passes the content-script relay filter
        // and has to be captured (and rejected) by the SDK branch first
        if (isPrivateStateRequest(action)) {
          if (!isTrustedUiSender(sender)) {
            warnUntrustedSameExtensionSender(sender, 'private-state request');
            // No data (and no error detail) for untrusted senders
            return;
          }
          return sendResponse(selectPrivateState(store.getState()));
        }

        if (typeof action.type === 'string') {
          const typedAction = action as { type: string };

          // Redux forwarding takes `sender`: its window-attach branch decides a
          // request's lifecycle, so that one is gated the same way the two
          // handlers below are. It is therefore called directly rather than
          // through a uniform (action, store) loop.
          const reduxResult = await handleReduxAction(
            typedAction,
            sender,
            store
          );
          if (reduxResult.handled) {
            return respond(reduxResult);
          }

          const bringWeb3Result = await handleBringWeb3(typedAction, store);
          if (bringWeb3Result.handled) {
            return respond(bringWeb3Result);
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

          throw unknownReduxActionError(typedAction);
        }

        // this is added for not spamming with errors from bringweb3
        if (action?.from === 'bringweb3') {
          return;
        }

        throw unknownMessageError(action);
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
