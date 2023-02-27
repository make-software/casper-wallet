import { convertHexToBytes } from '@src/libs/crypto/utils';
import { CasperWalletEventType } from './sdk-event-type';
import {
  SdkMethodEventType,
  isSDKMethod,
  sdkMethod,
  SdkMethod
} from './sdk-method';

export type SignatureResponse =
  | {
      cancelled: true; // if sign was cancelled
    }
  | {
      cancelled: false; // if sign was successfull
      signatureHex: string; // signature as hex hash
      signature: Uint8Array; // signature as byte array
    };

const DefaultOptions: CasperWalletProviderOptions = {
  timeout: 30 * 60 * 1000 /** 30min */
};

function fetchFromBackground<T extends SdkMethod['payload']>(
  requestAction: SdkMethod,
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
    }, options?.timeout || DefaultOptions.timeout);

    // console.log('SDK SENT REQUEST:', JSON.stringify(requestAction));
    window.dispatchEvent(
      new CustomEvent(SdkMethodEventType.Request, {
        detail: requestAction
      })
    );

    const waitForResponseEvent = (e: Event) => {
      const message = JSON.parse((e as CustomEvent).detail);
      // console.log('SDK GOT RESPONSE:', JSON.stringify(message));
      // filter out response events not for this request
      if (
        !isSDKMethod(message) ||
        message.meta.requestId !== requestAction.meta.requestId
      ) {
        return;
      }

      window.removeEventListener(
        SdkMethodEventType.Response,
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

    window.addEventListener(SdkMethodEventType.Response, waitForResponseEvent);
  });
}

export type CasperWalletProviderOptions = {
  timeout: number; // timeout of request to extension (in ms)
};

export const CasperWalletProvider = (options?: CasperWalletProviderOptions) => {
  let requestId = 0;
  const generateRequestId = (): string => {
    requestId = requestId + 1;
    return requestId.toString();
  };

  return {
    /**
     * Request the connect interface with the Casper Wallet extension. Will not show UI for already connected accounts and return true immediately.
     * @returns `true` value when connection request is accepted by the user or when account is already connected, `false` otherwise.
     */
    requestConnection(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<typeof sdkMethod['connectResponse']>['payload']
      >(
        sdkMethod.connectRequest(
          { origin: window.location.origin, title: document.title },
          {
            requestId: generateRequestId()
          }
        ),
        options
      );
    },
    /**
     * Request the switch account interface with the Casper Wallet extension
     * @returns `true` value when successfully switched account, `false` otherwise.
     */
    requestSwitchAccount(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<typeof sdkMethod['switchAccountResponse']>['payload']
      >(
        sdkMethod.switchAccountRequest(
          { origin: window.location.origin, title: document.title },
          {
            requestId: generateRequestId()
          }
        ),
        options
      );
    },
    /**
     * Request the sign deploy interface with the Casper Wallet extension
     * @param deployJson - stringified json of a deploy (use `DeployUtil.deployToJson` from `casper-js-sdk` and `JSON.stringify`)
     * @param signingPublicKeyHex - public key hash (in hex format)
     * @returns a payload response when user responded to transaction request, it will contain `signature` if approved, or `cancelled === true` flag when rejected.
     */
    sign: (
      deployJson: string,
      signingPublicKeyHex: string
    ): Promise<SignatureResponse> => {
      return fetchFromBackground<
        ReturnType<typeof sdkMethod['signResponse']>['payload']
      >(
        sdkMethod.signRequest(
          {
            deployJson,
            signingPublicKeyHex
          },
          {
            requestId: generateRequestId()
          }
        )
      ).then(res => {
        // response empty because it was canceled
        if (res.cancelled) {
          return res;
        }

        const signature = convertHexToBytes(res.signatureHex);
        return {
          cancelled: res.cancelled,
          signatureHex: res.signatureHex,
          signature
        };
      });
    },
    /**
     * Request the sign message interface with the Casper Wallet extension
     * @param message - message to sign as string
     * @param signingPublicKeyHex - public key hash (in hex format)
     * @returns a payload response when user responded to transaction request, it will contain `signature` if approved, or `cancelled === true` flag when rejected.
     */
    signMessage: (
      message: string,
      signingPublicKeyHex: string
    ): Promise<SignatureResponse> => {
      return fetchFromBackground<
        ReturnType<typeof sdkMethod['signMessageResponse']>['payload']
      >(
        sdkMethod.signMessageRequest(
          {
            message,
            signingPublicKeyHex
          },
          {
            requestId: generateRequestId()
          }
        )
      ).then(res => {
        // response empty because it was canceled
        if (res.cancelled) {
          return res;
        }

        const signature = convertHexToBytes(res.signatureHex);
        return {
          cancelled: res.cancelled,
          signatureHex: res.signatureHex,
          signature
        };
      });
    },
    /**
     * Disconnect the Casper Wallet extension
     * @returns `true` value when successfully disconnected, `false` otherwise.
     */
    disconnectFromSite(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<typeof sdkMethod['disconnectResponse']>['payload']
      >(
        sdkMethod.disconnectRequest(window.location.origin, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    /**
     * Get the connection status of the Casper Wallet extension
     * @returns `true` value when curently connected at least one account, `false` otherwise.
     */
    isConnected(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<typeof sdkMethod['isConnectedResponse']>['payload']
      >(
        sdkMethod.isConnectedRequest(window.location.origin, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    /**
     * Get the active public key of the Casper Wallet extension
     * @returns returns hex hash of the active public key.
     */
    getActivePublicKey(): Promise<string | undefined> {
      return fetchFromBackground<
        ReturnType<typeof sdkMethod['getActivePublicKeyResponse']>['payload']
      >(
        sdkMethod.getActivePublicKeyRequest(undefined, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    /**
     * Get version of the Casper Wallet extension
     * @returns version of the installed wallet extension.
     */
    getVersion(): Promise<string> {
      return fetchFromBackground<
        ReturnType<typeof sdkMethod['getVersionResponse']>['payload']
      >(
        sdkMethod.getVersionRequest(undefined, {
          requestId: generateRequestId()
        }),
        options
      );
    }
  };
};

declare global {
  interface Window {
    CasperWalletProvider: typeof CasperWalletProvider;
    CasperWalletEventTypes: typeof CasperWalletEventType;
  }
}

window.CasperWalletEventTypes = CasperWalletEventType;
window.CasperWalletProvider = CasperWalletProvider;
