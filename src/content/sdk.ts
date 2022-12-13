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
      const responseAction = JSON.parse((e as CustomEvent).detail);
      // console.log('SDK GOT RESPONSE:', JSON.stringify(responseAction));
      // filter out response events not for this request
      if (
        !isSDKMessage(responseAction) ||
        responseAction.meta.requestId !== requestAction.meta.requestId
      ) {
        return;
      }

      window.removeEventListener(
        sdkMessageProxyEvents.SDKResponseAction,
        waitForResponseEvent
      );
      resolve(responseAction.payload as T);
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
      { cancelled: true } | { cancelled: false; signature: Uint8Array }
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
      );
    },
    signMessage(message: string, signingPublicKey: string): Promise<string> {
      throw Error('Not implementeed');
    }
  };
};

declare global {
  interface Window {
    CasperWalletProvider: typeof CasperWalletProvider;
  }
}

window.CasperWalletProvider = CasperWalletProvider;
// for backward compatibility
const casperWalletProviderInstance = CasperWalletProvider();
window.casperlabsHelper = {
  requestConnection: casperWalletProviderInstance.requestConnection,
  disconnectFromSite: casperWalletProviderInstance.disconnectFromSite,
  getActivePublicKey: casperWalletProviderInstance.getActivePublicKey as any,
  getSelectedPublicKeyBase64:
    casperWalletProviderInstance.getActivePublicKey as any,
  getVersion: casperWalletProviderInstance.getVersion,
  isConnected: casperWalletProviderInstance.isConnected,
  sign: casperWalletProviderInstance.sign as any,
  signMessage: casperWalletProviderInstance.signMessage
};
