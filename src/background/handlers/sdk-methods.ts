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
import { getPayload } from '@background/redux/vault/payload-map';
import {
  selectAccountNamesByOriginDict,
  selectDeploysJsonById,
  selectEip712JsonById,
  selectIsAccountConnected,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';
import {
  windowRequestOpened,
  windowRequestResponded
} from '@background/redux/windowManagement/actions';
import { isStorableRequestId } from '@background/redux/windowManagement/request-map';
import {
  selectOpenRequests,
  selectRequestStatus
} from '@background/redux/windowManagement/selectors';
import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { SiteNotConnectedError, WalletLockedError } from '@content/sdk-errors';
import { sdkEvent } from '@content/sdk-event';
import { SdkMethod, sdkMethod } from '@content/sdk-method';
import { SdkErrorCode } from '@content/sdk-types';

import { encryptAsHexWithCasperPublicKey } from '@libs/crypto';

import { selectVaultIsLocked } from '../redux/session/selectors';
import { HandlerResult } from './types';

// The methods that register a request and open an approval window. Kept as one
// set so the duplicate guard cannot be forgotten by a seventh flow.
const APPROVAL_REQUEST_TYPES: ReadonlySet<string> = new Set([
  sdkMethod.connectRequest.type,
  sdkMethod.switchAccountRequest.type,
  sdkMethod.signRequest.type,
  sdkMethod.signMessageRequest.type,
  sdkMethod.signTypedDataRequest.type,
  sdkMethod.decryptMessageRequest.type
]);

const CAPACITY_REFUSAL_MESSAGE = 'Too many pending signature requests';

// Log-only rather than `sagaError`: this path is dapp-triggerable, so a banner
// would be a page's to spam. Identifiers only — never payload or origin.
function reportCapacityRefusal(action: SdkMethod) {
  console.error(
    'sdk-methods: pending-payload map at capacity, request refused',
    { requestId: action.meta.requestId, method: action.type }
  );
}

// Same logging rationale as `reportCapacityRefusal`. `openCount` is the count
// AFTER the refused write — how full the map the refusal fired against was.
function reportOpenRequestCapacityRefusal(
  action: SdkMethod,
  openCount: number
) {
  console.error('sdk-methods: open-request map at capacity, request refused', {
    requestId: action.meta.requestId,
    method: action.type,
    openCount
  });
}

export async function handleSdkMethod(
  action: SdkMethod,
  sender: Runtime.MessageSender,
  store: MainStore
): Promise<HandlerResult> {
  // `requestId` is dapp-controlled, and the reducer refuses a duplicate
  // silently — refuse here so no window opens on a request it never registered.
  if (APPROVAL_REQUEST_TYPES.has(action.type)) {
    // An unstorable id is refused by the reducer too, leaving the request
    // outside cancel-on-close, supersede, response dedup and window recovery.
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
          frameId: sender.frameId,
          origin,
          method: 'connect'
        })
      );

      // At `MAX_OPEN_REQUESTS` the reducer refused the write silently; this
      // method has no capacity map of its own to read back.
      if (
        selectRequestStatus(store.getState(), action.meta.requestId) == null
      ) {
        reportOpenRequestCapacityRefusal(
          action,
          selectOpenRequests(store.getState()).length
        );

        return {
          handled: true,
          response: sdkMethod.connectResponse(false, action.meta)
        };
      }

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
        frameId: sender.frameId,
        origin,
        method: 'switchAccount'
      })
    );

    if (selectRequestStatus(store.getState(), action.meta.requestId) == null) {
      reportOpenRequestCapacityRefusal(
        action,
        selectOpenRequests(store.getState()).length
      );

      return {
        handled: true,
        response: sdkMethod.switchAccountResponse(false, action.meta)
      };
    }

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
      // The dapp-facing message stays generic; the cause is kept here as a
      // static message + error object, never the payload.
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

    // No `await` before `windowRequestOpened` below: `reconcileStalePayloadsSaga`
    // purges a payload that no descriptor and no window claims.
    store.dispatch(
      deployPayloadReceived({
        id: action.meta.requestId,
        json: deployJson
      })
    );

    // At capacity `storePayload` refuses the INCOMING write; without answering
    // here the window opens on a payload the page can never read.
    if (
      getPayload(
        selectDeploysJsonById(store.getState()),
        action.meta.requestId
      ) == null
    ) {
      reportCapacityRefusal(action);

      return {
        handled: true,
        response: sdkMethod.signResponse(
          {
            cancelled: true,
            message: CAPACITY_REFUSAL_MESSAGE,
            errorCode: SdkErrorCode.tooManyPendingRequests
          },
          { requestId: action.meta.requestId }
        )
      };
    }

    store.dispatch(
      windowRequestOpened({
        requestId: action.meta.requestId,
        tabId: senderTabId,
        frameId: sender.frameId,
        origin,
        method: 'sign'
      })
    );

    // The payload above has ALREADY been accepted, so a silent refusal here
    // strands it; `windowRequestResponded` makes the vault reducer drop it.
    if (selectRequestStatus(store.getState(), action.meta.requestId) == null) {
      reportOpenRequestCapacityRefusal(
        action,
        selectOpenRequests(store.getState()).length
      );
      store.dispatch(
        windowRequestResponded({ requestId: action.meta.requestId })
      );

      return {
        handled: true,
        response: sdkMethod.signResponse(
          {
            cancelled: true,
            message: CAPACITY_REFUSAL_MESSAGE,
            errorCode: SdkErrorCode.tooManyPendingRequests
          },
          { requestId: action.meta.requestId }
        )
      };
    }

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
        frameId: sender.frameId,
        origin,
        method: 'signMessage'
      })
    );

    if (selectRequestStatus(store.getState(), action.meta.requestId) == null) {
      reportOpenRequestCapacityRefusal(
        action,
        selectOpenRequests(store.getState()).length
      );

      return {
        handled: true,
        response: sdkMethod.signMessageResponse(
          { cancelled: true },
          action.meta
        )
      };
    }

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

    // Same synchronous block as the deploy branch, for the same reason.
    store.dispatch(
      eip712PayloadReceived({
        id: action.meta.requestId,
        json: JSON.stringify({ typedData, options })
      })
    );

    // Same refusal as the deploy branch above, on the other map.
    if (
      getPayload(
        selectEip712JsonById(store.getState()),
        action.meta.requestId
      ) == null
    ) {
      reportCapacityRefusal(action);

      return {
        handled: true,
        response: sdkMethod.signTypedDataResponse(
          {
            cancelled: true,
            signature: null,
            digest: null,
            publicKey: null,
            error: CAPACITY_REFUSAL_MESSAGE,
            errorCode: SdkErrorCode.tooManyPendingRequests
          },
          { requestId: action.meta.requestId }
        )
      };
    }

    store.dispatch(
      windowRequestOpened({
        requestId: action.meta.requestId,
        tabId: senderTabId,
        frameId: sender.frameId,
        origin,
        method: 'signTypedData'
      })
    );

    // Same residual as the deploy branch, reclaimed the same way.
    if (selectRequestStatus(store.getState(), action.meta.requestId) == null) {
      reportOpenRequestCapacityRefusal(
        action,
        selectOpenRequests(store.getState()).length
      );
      store.dispatch(
        windowRequestResponded({ requestId: action.meta.requestId })
      );

      return {
        handled: true,
        response: sdkMethod.signTypedDataResponse(
          {
            cancelled: true,
            signature: null,
            digest: null,
            publicKey: null,
            error: CAPACITY_REFUSAL_MESSAGE,
            errorCode: SdkErrorCode.tooManyPendingRequests
          },
          { requestId: action.meta.requestId }
        )
      };
    }

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
        frameId: sender.frameId,
        origin,
        method: 'decryptMessage'
      })
    );

    if (selectRequestStatus(store.getState(), action.meta.requestId) == null) {
      reportOpenRequestCapacityRefusal(
        action,
        selectOpenRequests(store.getState()).length
      );

      return {
        handled: true,
        response: sdkMethod.decryptMessageResponse(
          { cancelled: true },
          action.meta
        )
      };
    }

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
