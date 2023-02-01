import { convertHexToBytes } from '@src/libs/crypto/utils';
import { SdkEventTypes } from './sdk-event-types';
import {
  sdkMessageProxyEvents,
  isSDKMessage,
  sdkMessage,
  SdkMessage
} from './sdk-message';

function fetchFromBackground<T extends SdkMessage['payload']>(
  requestAction: SdkMessage,
  options?: CasperWalletProviderOptions
): Promise<T> {
  return new Promise((resolve, reject) => {
    // timeout & cleanup to prevent memory leaks
    const timeoutId = setTimeout(() => {
      reject(
        Error(
          `SDK RESPONSE TIMEOUT: ${requestAction.type}:${requestAction.meta.requestId}`
        )
      );
    }, options?.timeout || /** 30min */ 30 * 60 * 1000);

    // console.log('SDK SENT REQUEST:', JSON.stringify(requestAction));
    window.dispatchEvent(
      new CustomEvent(sdkMessageProxyEvents.SDKRequestAction, {
        detail: requestAction
      })
    );

    const waitForResponseEvent = (e: Event) => {
      const message = JSON.parse((e as CustomEvent).detail);
      // console.log('SDK GOT RESPONSE:', JSON.stringify(message));
      // filter out response events not for this request
      if (
        !isSDKMessage(message) ||
        message.meta.requestId !== requestAction.meta.requestId
      ) {
        return;
      }

      window.removeEventListener(
        sdkMessageProxyEvents.SDKResponseAction,
        waitForResponseEvent
      );
      // check for errors
      if (message.payload instanceof Error) {
        reject(message.payload);
      } else {
        resolve(message.payload as T);
      }

      clearTimeout(timeoutId);
    };

    window.addEventListener(
      sdkMessageProxyEvents.SDKResponseAction,
      waitForResponseEvent
    );
  });
}

export type CasperWalletProviderOptions = {
  timeout: number;
};

export const CasperWalletProvider = (options?: CasperWalletProviderOptions) => {
  let requestId = 0;
  const generateRequestId = (): string => {
    requestId = requestId + 1;
    return requestId.toString();
  };

  return {
    requestConnection(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<typeof sdkMessage['connectResponse']>['payload']
      >(
        sdkMessage.connectRequest(
          { origin: window.location.origin, title: document.title },
          {
            requestId: generateRequestId()
          }
        ),
        options
      );
    },
    disconnectFromSite(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<typeof sdkMessage['disconnectResponse']>['payload']
      >(
        sdkMessage.disconnectRequest(window.location.origin, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    requestSwitchAccount(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<typeof sdkMessage['switchAccountResponse']>['payload']
      >(
        sdkMessage.switchAccountRequest(
          { origin: window.location.origin, title: document.title },
          {
            requestId: generateRequestId()
          }
        ),
        options
      );
    },
    isConnected(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<typeof sdkMessage['isConnectedResponse']>['payload']
      >(
        sdkMessage.isConnectedRequest(window.location.origin, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    getActivePublicKey(): Promise<string | undefined> {
      return fetchFromBackground<
        ReturnType<typeof sdkMessage['getActivePublicKeyResponse']>['payload']
      >(
        sdkMessage.getActivePublicKeyRequest(undefined, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    getVersion(): Promise<string> {
      return fetchFromBackground<
        ReturnType<typeof sdkMessage['getVersionResponse']>['payload']
      >(
        sdkMessage.getVersionRequest(undefined, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    sign: (
      deployJson: string,
      signingPublicKeyHex: string
    ): Promise<
      | { cancelled: true }
      | { cancelled: false; signatureHex: string; signature: Uint8Array }
    > => {
      return fetchFromBackground<
        ReturnType<typeof sdkMessage['signResponse']>['payload']
      >(
        sdkMessage.signRequest(
          {
            deployJson,
            signingPublicKeyHex
          },
          {
            requestId: generateRequestId()
          }
        )
      ).then(res => {
        if (res.cancelled === false) {
          const signature = convertHexToBytes(res.signatureHex);
          return {
            cancelled: res.cancelled,
            signatureHex: res.signatureHex,
            signature
          };
        }

        return res;
      });
    },
    signMessage: (
      message: string,
      signingPublicKeyHex: string
    ): Promise<
      | { cancelled: true }
      | { cancelled: false; signatureHex: string; signature: Uint8Array }
    > => {
      return fetchFromBackground<
        ReturnType<typeof sdkMessage['signMessageResponse']>['payload']
      >(
        sdkMessage.signMessageRequest(
          {
            message,
            signingPublicKeyHex
          },
          {
            requestId: generateRequestId()
          }
        )
      ).then(res => {
        if (res.cancelled === false) {
          const signature = convertHexToBytes(res.signatureHex);
          return {
            cancelled: res.cancelled,
            signatureHex: res.signatureHex,
            signature
          };
        }

        return res;
      });
    }
  };
};

declare global {
  interface Window {
    CasperWalletProvider: typeof CasperWalletProvider;
    CasperWalletEventTypes: typeof SdkEventTypes;
  }
}

window.CasperWalletEventTypes = SdkEventTypes;
window.CasperWalletProvider = CasperWalletProvider;
