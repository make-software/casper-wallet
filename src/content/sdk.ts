import {
  sdkMessageProxyEvents,
  isSDKMessage,
  sdkMessage,
  SdkMessage
} from './sdk-message';

function fetchFromExtensionBackend<T extends SdkMessage['payload']>(
  requestAction: SdkMessage,
  options?: CasperWalletProviderOptions
): Promise<T> {
  return new Promise((resolve, reject) => {
    // timeout & cleanup to prevent memory leaks
    const timeoutId = setTimeout(() => {
      reject(
        Error(
          `SDK RESPONSE TIMEOUT: ${requestAction.type}:${requestAction.meta.id}`
        )
      );
    }, options?.timeout || 60000);

    console.error('SDK SENT REQUEST:', JSON.stringify(requestAction));
    window.dispatchEvent(
      new CustomEvent(sdkMessageProxyEvents.SDKRequestAction, {
        detail: requestAction
      })
    );

    const waitForResponseEvent = (e: Event) => {
      const responseAction = JSON.parse((e as CustomEvent).detail);
      console.error('SDK GOT RESPONSE:', JSON.stringify(responseAction));
      // filter out response events not for this request
      if (
        !isSDKMessage(responseAction) ||
        responseAction.meta.id !== requestAction.meta.id
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

  return {
    requestConnection: async (): Promise<boolean> => {
      return fetchFromExtensionBackend<
        ReturnType<typeof sdkMessage['connectResponse']>['payload']
      >(
        sdkMessage.connectRequest(window.location.origin, {
          id: requestId++
        }),
        options
      );
    },
    disconnectFromSite(): Promise<boolean> {
      return fetchFromExtensionBackend<
        ReturnType<typeof sdkMessage['disconnectResponse']>['payload']
      >(
        sdkMessage.disconnectRequest(window.location.origin, {
          id: requestId++
        }),
        options
      );
    },
    isConnected(): Promise<boolean> {
      return fetchFromExtensionBackend<
        ReturnType<typeof sdkMessage['isConnectedResponse']>['payload']
      >(
        sdkMessage.isConnectedRequest(window.location.origin, {
          id: requestId++
        }),
        options
      );
    },
    getActivePublicKey(): Promise<string | undefined> {
      return fetchFromExtensionBackend<
        ReturnType<typeof sdkMessage['getActivePublicKeyResponse']>['payload']
      >(
        sdkMessage.getActivePublicKeyRequest(undefined, {
          id: requestId++
        }),
        options
      );
    },
    getVersion(): Promise<string> {
      return fetchFromExtensionBackend<
        ReturnType<typeof sdkMessage['getVersionResponse']>['payload']
      >(
        sdkMessage.getVersionRequest(undefined, {
          id: requestId++
        }),
        options
      );
    },
    sign(
      deploy: { deploy: any },
      signingPublicKeyHex: string,
      targetPublicKeyHex: string | undefined
    ): Promise<{ deploy: any }> {
      return fetchFromExtensionBackend<
        ReturnType<typeof sdkMessage['signingRequest']>['payload']
      >(
        sdkMessage.signingRequest(
          {
            deploy,
            targetPublicKeyHex,
            signingPublicKeyHex
          },
          {
            id: requestId++
          }
        )
      );
    },
    signMessage(rawMessage: string, signingPublicKey: string): Promise<string> {
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
  sign: casperWalletProviderInstance.sign,
  signMessage: casperWalletProviderInstance.signMessage
};
