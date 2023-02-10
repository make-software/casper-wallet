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
    getVersion(): Promise<string> {
      return fetchFromBackground<
        ReturnType<typeof sdkMethod['getVersionResponse']>['payload']
      >(
        sdkMethod.getVersionRequest(undefined, {
          requestId: generateRequestId()
        }),
        options
      );
    },
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
