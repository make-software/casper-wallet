import { Deploy, PublicKey } from 'casper-js-sdk';
import { Runtime, runtime } from 'webextension-polyfill';

import {
  getActiveAccountSupports,
  getUrlOrigin,
  isEqualCaseInsensitive
} from '@src/utils';

import { WindowApp } from '@background/create-open-window';
import {
  CannotGetActiveAccountError,
  CannotGetSenderOriginError,
  ENCRYPT_MESSAGE_MAX_LENGTH
} from '@background/internal-errors';
import { openWindow } from '@background/open-window';
import { MainStore } from '@background/redux/get-main-store';
import {
  deployPayloadReceived,
  eip712PayloadReceived,
  siteDisconnected
} from '@background/redux/vault/actions';
import {
  selectAccountNamesByOriginDict,
  selectIsAccountConnected,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';
import { windowRequestOpened } from '@background/redux/windowManagement/actions';
import { isStorableRequestId } from '@background/redux/windowManagement/request-map';
import { selectRequestStatus } from '@background/redux/windowManagement/selectors';
import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { SiteNotConnectedError, WalletLockedError } from '@content/sdk-errors';
import { sdkEvent } from '@content/sdk-event';
import { SdkMethod, sdkMethod } from '@content/sdk-method';

import { encryptAsHexWithCasperPublicKey } from '@libs/crypto';

import { selectVaultIsLocked } from '../redux/session/selectors';
import { HandlerResult } from './types';

// The six methods that register a request and open an approval window. Kept as
// one set, checked once below, so the duplicate guard cannot be forgotten by a
// seventh flow the way it would be if it were copied into each branch.
const APPROVAL_REQUEST_TYPES: ReadonlySet<string> = new Set([
  sdkMethod.connectRequest.type,
  sdkMethod.switchAccountRequest.type,
  sdkMethod.signRequest.type,
  sdkMethod.signMessageRequest.type,
  sdkMethod.signTypedDataRequest.type,
  sdkMethod.decryptMessageRequest.type
]);

export async function handleSdkMethod(
  action: SdkMethod,
  sender: Runtime.MessageSender,
  store: MainStore
): Promise<HandlerResult> {
  // `requestId` is page-generated (`generateRequestId`, src/content/sdk.ts),
  // i.e. dapp-controlled. The slice reducer already refuses to overwrite a live
  // request or resurrect a tombstone, but that no-op was invisible to the
  // caller: every branch below went on to open a window anyway. The result was
  // a fully functional approval screen for a request the wallet could never
  // answer — a replayed id renders normally, the user approves, and the
  // response is dropped by the dedup with the dapp none the wiser. Reusing a
  // LIVE id under another method is worse still: the first descriptor is kept,
  // so a later cancel is built in the wrong shape. Refuse both here, before
  // anything is dispatched.
  if (APPROVAL_REQUEST_TYPES.has(action.type)) {
    // `__proto__` cannot be a key in the requests map, so the reducer refuses
    // it — and without answering here, the caller would go on to open a window
    // for a request the store never registered: outside cancellation on close,
    // on supersede, the response dedup and the window-open recovery alike.
    if (!isStorableRequestId(action.meta.requestId)) {
      throw Error('Invalid requestId');
    }

    if (selectRequestStatus(store.getState(), action.meta.requestId) != null) {
      throw Error('Duplicate requestId');
    }
  }

  if (sdkMethod.connectRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);
    if (!origin) {
      throw CannotGetSenderOriginError();
    }
    const senderTabId = sender.tab?.id;

    if (senderTabId == null) {
      throw Error('Missing sender tab id');
    }

    const activeAccount = selectVaultActiveAccount(store.getState());

    const query: Record<string, string> = {
      requestId: action.meta.requestId,
      origin: origin,
      tabId: String(senderTabId)
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
      return {
        handled: true,
        response: sdkMethod.connectResponse(true, action.meta)
      };
    } else {
      store.dispatch(
        windowRequestOpened({
          requestId: action.meta.requestId,
          tabId: senderTabId,
          origin,
          method: 'connect'
        })
      );
      openWindow(store, {
        windowApp: WindowApp.ConnectToApp,
        searchParams: query,
        requestId: action.meta.requestId
      });
    }

    return { handled: true, response: undefined };
  } else if (sdkMethod.switchAccountRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);
    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    const senderTabId = sender.tab?.id;

    if (senderTabId == null) {
      throw Error('Missing sender tab id');
    }

    const query: Record<string, string> = {
      requestId: action.meta.requestId,
      origin: origin,
      tabId: String(senderTabId)
    };
    if (action.payload.title != null) {
      query.title = action.payload.title;
    }

    store.dispatch(
      windowRequestOpened({
        requestId: action.meta.requestId,
        tabId: senderTabId,
        origin,
        method: 'switchAccount'
      })
    );
    openWindow(store, {
      windowApp: WindowApp.SwitchAccount,
      searchParams: query,
      requestId: action.meta.requestId
    });

    return { handled: true, response: undefined };
  } else if (sdkMethod.signRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);
    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    const senderTabId = sender.tab?.id;

    if (senderTabId == null) {
      throw Error('Missing sender tab id');
    }

    const { signingPublicKeyHex } = action.payload;
    let deployJson;
    try {
      deployJson = JSON.parse(action.payload.deployJson);
    } catch (err) {
      // The dapp-facing message stays generic (it crosses a trust boundary);
      // the cause is kept here, otherwise a parse failure is unrecoverable
      // from a bug report.
      // Static message + error object, never the payload.
      console.error('sdk-methods: deploy json string parse failed:', err);
      throw Error('Deploy json string parse error');
    }

    const deploy: Deploy = deployJson.deploy;

    const isDeployAlreadySigningWithThisAccount =
      deploy?.approvals?.some(approvals =>
        isEqualCaseInsensitive(approvals.signer.toString(), signingPublicKeyHex)
      ) ?? false;

    if (isDeployAlreadySigningWithThisAccount) {
      return {
        handled: true,
        response: sdkMethod.signResponse(
          {
            cancelled: true,
            message: 'This deploy already sign by this account'
          },
          { requestId: action.meta.requestId }
        )
      };
    }

    store.dispatch(
      deployPayloadReceived({
        id: action.meta.requestId,
        json: deployJson
      })
    );

    store.dispatch(
      windowRequestOpened({
        requestId: action.meta.requestId,
        tabId: senderTabId,
        origin,
        method: 'sign'
      })
    );
    openWindow(store, {
      windowApp: WindowApp.SignatureRequestDeploy,
      searchParams: {
        requestId: action.meta.requestId,
        signingPublicKeyHex,
        origin,
        tabId: String(senderTabId)
      },
      requestId: action.meta.requestId
    });

    return { handled: true, response: undefined };
  } else if (sdkMethod.signMessageRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);
    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    const senderTabId = sender.tab?.id;

    if (senderTabId == null) {
      throw Error('Missing sender tab id');
    }

    const { signingPublicKeyHex, message } = action.payload;

    store.dispatch(
      windowRequestOpened({
        requestId: action.meta.requestId,
        tabId: senderTabId,
        origin,
        method: 'signMessage'
      })
    );
    openWindow(store, {
      windowApp: WindowApp.SignatureRequestMessage,
      searchParams: {
        requestId: action.meta.requestId,
        signingPublicKeyHex,
        message,
        origin,
        tabId: String(senderTabId)
      },
      requestId: action.meta.requestId
    });

    return { handled: true, response: undefined };
  } else if (sdkMethod.signTypedDataRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);
    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    const senderTabId = sender.tab?.id;

    if (senderTabId == null) {
      throw Error('Missing sender tab id');
    }

    const { signingPublicKeyHex, typedData, options } = action.payload;

    store.dispatch(
      eip712PayloadReceived({
        id: action.meta.requestId,
        json: JSON.stringify({ typedData, options })
      })
    );

    store.dispatch(
      windowRequestOpened({
        requestId: action.meta.requestId,
        tabId: senderTabId,
        origin,
        method: 'signTypedData'
      })
    );
    openWindow(store, {
      windowApp: WindowApp.SignatureRequestEip712,
      searchParams: {
        requestId: action.meta.requestId,
        signingPublicKeyHex,
        origin,
        tabId: String(senderTabId)
      },
      requestId: action.meta.requestId
    });

    return { handled: true, response: undefined };
  } else if (sdkMethod.decryptMessageRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);

    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    const senderTabId = sender.tab?.id;

    if (senderTabId == null) {
      throw Error('Missing sender tab id');
    }

    const { signingPublicKeyHex, message } = action.payload;

    store.dispatch(
      windowRequestOpened({
        requestId: action.meta.requestId,
        tabId: senderTabId,
        origin,
        method: 'decryptMessage'
      })
    );
    openWindow(store, {
      windowApp: WindowApp.DecryptMessageRequest,
      searchParams: {
        requestId: action.meta.requestId,
        signingPublicKeyHex,
        message,
        origin,
        tabId: String(senderTabId)
      },
      requestId: action.meta.requestId
    });

    return { handled: true, response: undefined };
  } else if (sdkMethod.disconnectRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);
    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    let success = false;

    const isLocked = selectVaultIsLocked(store.getState());

    const activeAccount = selectVaultActiveAccount(store.getState());
    if (activeAccount == null) {
      throw CannotGetActiveAccountError();
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

    return {
      handled: true,
      response: sdkMethod.disconnectResponse(success, action.meta)
    };
  } else if (sdkMethod.isConnectedRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);
    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    const isLocked = selectVaultIsLocked(store.getState());
    if (isLocked) {
      return {
        handled: true,
        response: sdkMethod.isConnectedError(WalletLockedError(), action.meta)
      };
    }
    const accountNamesByOriginDict = selectAccountNamesByOriginDict(
      store.getState()
    );
    const isConnected = Boolean(origin in accountNamesByOriginDict);

    return {
      handled: true,
      response: sdkMethod.isConnectedResponse(isConnected, action.meta)
    };
  } else if (sdkMethod.getActivePublicKeyRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);
    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    const isLocked = selectVaultIsLocked(store.getState());
    if (isLocked) {
      return {
        handled: true,
        response: sdkMethod.getActivePublicKeyError(
          WalletLockedError(),
          action.meta
        )
      };
    }

    const activeAccount = selectVaultActiveAccount(store.getState());
    if (activeAccount == null) {
      throw CannotGetActiveAccountError();
    }

    const isConnected = selectIsAccountConnected(
      store.getState(),
      origin,
      activeAccount?.name
    );

    if (!isConnected) {
      return {
        handled: true,
        response: sdkMethod.getActivePublicKeyError(
          SiteNotConnectedError(),
          action.meta
        )
      };
    }

    return {
      handled: true,
      response: sdkMethod.getActivePublicKeyResponse(
        activeAccount.publicKey,
        action.meta
      )
    };
  } else if (sdkMethod.encryptMessageRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);

    const { signingPublicKeyHex, message = '' } = action.payload;

    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    try {
      PublicKey.fromHex(signingPublicKeyHex);
    } catch (e) {
      // Static message + error object, never key material.
      console.error('sdk-methods: public key hex invalid:', e);
      throw Error('Public key hex is not valid');
    }

    if (message.length > ENCRYPT_MESSAGE_MAX_LENGTH) {
      throw Error(
        `Message should be less than ${ENCRYPT_MESSAGE_MAX_LENGTH} symbols`
      );
    }

    try {
      const encryptedMessage = await encryptAsHexWithCasperPublicKey(
        signingPublicKeyHex,
        message
      );

      return {
        handled: true,
        response: sdkMethod.encryptMessageResponse(
          {
            encryptedMessage
          },
          action.meta
        )
      };
    } catch (e) {
      // Static message + error object, never the message content.
      console.error('sdk-methods: message encryption failed:', e);
      throw Error('Error during message encryption');
    }
  } else if (sdkMethod.getActivePublicKeySupportsRequest.match(action)) {
    const origin = getUrlOrigin(sender.url);

    if (!origin) {
      throw CannotGetSenderOriginError();
    }

    const isLocked = selectVaultIsLocked(store.getState());

    if (isLocked) {
      return {
        handled: true,
        response: sdkMethod.getActivePublicKeySupportsError(
          WalletLockedError(),
          action.meta
        )
      };
    }

    const activeAccount = selectVaultActiveAccount(store.getState());

    if (!activeAccount) {
      throw CannotGetActiveAccountError();
    }

    const isConnected = selectIsAccountConnected(
      store.getState(),
      origin,
      activeAccount?.name
    );

    if (!isConnected) {
      return {
        handled: true,
        response: sdkMethod.getActivePublicKeySupportsError(
          SiteNotConnectedError(),
          action.meta
        )
      };
    }

    const supports = getActiveAccountSupports(activeAccount);

    return {
      handled: true,
      response: sdkMethod.getActivePublicKeySupportsResponse(
        supports,
        action.meta
      )
    };
  } else if (sdkMethod.getVersionRequest.match(action)) {
    const manifestData = runtime.getManifest();
    const version = manifestData.version;

    return {
      handled: true,
      response: sdkMethod.getVersionResponse(version, action.meta)
    };
  }

  return { handled: false };
}
