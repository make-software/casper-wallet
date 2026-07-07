import { convertHexToBytes } from '@libs/crypto/utils';

import { SDK_HANDSHAKE_TYPE, isTrustedWindowMessage } from './sdk-channel';
import { CasperWalletEventType } from './sdk-event-type';
import { SdkMethod, isSDKMethod, sdkMethod } from './sdk-method';
import { SignTypedDataParams, SignTypedDataResult } from './sdk-types';

// The private port to the content script, received once during the handshake.
// Requests and responses ride this port instead of the forgeable window bus.
let sdkPort: MessagePort | null = null;

window.addEventListener('message', (e: MessageEvent) => {
  if (
    isTrustedWindowMessage(e) &&
    e.data?.type === SDK_HANDSHAKE_TYPE &&
    e.ports[0]
  ) {
    sdkPort = e.ports[0];
    // begin dispatching queued/incoming messages on the port
    sdkPort.start();
  }
});

export type SignatureResponse =
  | {
      cancelled: true; // if sign was cancelled
      message?: string;
    }
  | {
      cancelled: false; // if sign was successfull
      signatureHex: string; // signature as hex hash
      signature: Uint8Array; // signature as byte array
    };

export type DecryptedResponse =
  | {
      cancelled: true; // if sign was cancelled
    }
  | {
      cancelled: false; // if sign was successfull
      decryptedMessage: string; // decrypted message
    };

const DefaultOptions: CasperWalletProviderOptions = {
  timeout: 30 * 60 * 1000 /** 30min */
};

function fetchFromBackground<T extends SdkMethod['payload']>(
  requestAction: SdkMethod,
  options?: CasperWalletProviderOptions
): Promise<T> {
  return new Promise((resolve, reject) => {
    const port = sdkPort;
    if (!port) {
      // handshake hasn't completed yet — the content script hands the port over
      // on SDK load, so this should only happen if a request is fired before the
      // page fully initialised.
      reject(Error(`SDK PORT NOT ESTABLISHED: ${requestAction.type}`));
      return;
    }

    // timeout & cleanup to prevent memory leaks
    const timeoutId = setTimeout(() => {
      port.removeEventListener('message', waitForResponse);
      reject(
        Error(
          `SDK RESPONSE TIMEOUT: ${requestAction.type}:${requestAction.meta.requestId}`
        )
      );
    }, options?.timeout || DefaultOptions.timeout);

    const waitForResponse = (e: MessageEvent) => {
      const message = e.data;

      // filter out responses not for this request
      if (
        !isSDKMethod(message) ||
        message.meta.requestId !== requestAction.meta.requestId
      ) {
        return;
      }

      port.removeEventListener('message', waitForResponse);
      clearTimeout(timeoutId);
      // check for errors
      if ('error' in message && message.error) {
        reject(message.payload);
      } else {
        resolve(message.payload as T);
      }
    };

    port.addEventListener('message', waitForResponse);
    port.start();
    port.postMessage(requestAction);
  });
}

export type CasperWalletProviderOptions = {
  timeout: number; // timeout of request to extension (in ms)
};

// `crypto.randomUUID` is only defined in a secure context. The content script
// also matches plain `http://*/*` dapps, where `randomUUID` is `undefined`
// but `getRandomValues` remains available. Fall back to building an RFC4122
// v4 UUID from 16 CSPRNG bytes so both paths stay unpredictable and unique —
// never fall back to `Math.random`.
const generateRequestId = (): string => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return (
    hex.slice(0, 4).join('') +
    '-' +
    hex.slice(4, 6).join('') +
    '-' +
    hex.slice(6, 8).join('') +
    '-' +
    hex.slice(8, 10).join('') +
    '-' +
    hex.slice(10, 16).join('')
  );
};

export const CasperWalletProvider = (options?: CasperWalletProviderOptions) => {
  return {
    /**
     * Request the connect interface with the Casper Wallet extension. Will not show UI for already connected accounts and return true immediately.
     * @returns `true` value when connection request is accepted by the user or when account is already connected, `false` otherwise.
     */
    requestConnection(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<(typeof sdkMethod)['connectResponse']>['payload']
      >(
        sdkMethod.connectRequest(
          { title: document.title },
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
        ReturnType<(typeof sdkMethod)['switchAccountResponse']>['payload']
      >(
        sdkMethod.switchAccountRequest(
          { title: document.title },
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
        ReturnType<(typeof sdkMethod)['signResponse']>['payload']
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
        ReturnType<(typeof sdkMethod)['signMessageResponse']>['payload']
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
    signTypedData: (
      params: SignTypedDataParams,
      signingPublicKeyHex: string
    ): Promise<SignTypedDataResult> => {
      return fetchFromBackground<
        ReturnType<(typeof sdkMethod)['signTypedDataResponse']>['payload']
      >(
        sdkMethod.signTypedDataRequest(
          {
            typedData: params.typedData,
            options: params.options,
            signingPublicKeyHex
          },
          {
            requestId: generateRequestId()
          }
        )
      );
    },
    /**
     * Get the encrypted message from the Casper Wallet extension
     * @returns returns an encrypted message.
     * Message max length is 4096 symbols.
     */
    encryptMessage(message: string, signingPublicKeyHex: string) {
      return fetchFromBackground<
        ReturnType<(typeof sdkMethod)['encryptMessageResponse']>['payload']
      >(
        sdkMethod.encryptMessageRequest(
          {
            message,
            signingPublicKeyHex
          },
          {
            requestId: generateRequestId()
          }
        ),
        options
      );
    },
    /**
     * Request the decrypt message with the Casper Wallet extension
     * @param message - message to decrypt as string
     * @param signingPublicKeyHex - public key hash (in hex format)
     * @returns a payload response when user responded to request, it will contain `message` if approved, or `cancelled === true` flag when rejected.
     */
    decryptMessage: (
      message: string,
      signingPublicKeyHex: string
    ): Promise<DecryptedResponse> => {
      return fetchFromBackground<
        ReturnType<(typeof sdkMethod)['decryptMessageResponse']>['payload']
      >(
        sdkMethod.decryptMessageRequest(
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

        return {
          cancelled: res.cancelled,
          decryptedMessage: res.decryptedMessage
        };
      });
    },
    /**
     * Disconnect the Casper Wallet extension
     * @returns `true` value when successfully disconnected, `false` otherwise.
     */
    disconnectFromSite(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<(typeof sdkMethod)['disconnectResponse']>['payload']
      >(
        sdkMethod.disconnectRequest(undefined, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    /**
     * Get the connection status of the Casper Wallet extension
     * @returns `true` value when curently connected at least one account, `false` otherwise.
     * @throws when wallet is locked (err.code: 1)
     */
    isConnected(): Promise<boolean> {
      return fetchFromBackground<
        ReturnType<(typeof sdkMethod)['isConnectedResponse']>['payload']
      >(
        sdkMethod.isConnectedRequest(undefined, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    /**
     * Get the active public key of the Casper Wallet extension
     * @returns returns hex hash of the active public key.
     * @throws when wallet is locked (err.code: 1)
     * @throws when active account not approved to connect with the site (err.code: 2)
     */
    getActivePublicKey(): Promise<string> {
      return fetchFromBackground<
        ReturnType<(typeof sdkMethod)['getActivePublicKeyResponse']>['payload']
      >(
        sdkMethod.getActivePublicKeyRequest(undefined, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    /**
     * @deprecated // TODO remove in future releases
     * Get the encrypted message from the Casper Wallet extension
     * @returns returns an encrypted message.
     * Message max length is 4096 symbols.
     */
    getEncryptedMessage(message: string, signingPublicKeyHex: string) {
      console.warn(
        '`CasperWalletProvider().getEncryptedMessage` is deprecated and will be removed in future releases, use `CasperWalletProvider().encryptMessage` instead'
      );
      return fetchFromBackground<
        ReturnType<(typeof sdkMethod)['encryptMessageResponse']>['payload']
      >(
        sdkMethod.encryptMessageRequest(
          {
            message,
            signingPublicKeyHex
          },
          {
            requestId: generateRequestId()
          }
        ),
        options
      );
    },
    /**
     * Get version of the installed Casper Wallet extension
     * @returns version of the installed wallet extension.
     */
    getVersion(): Promise<string> {
      return fetchFromBackground<
        ReturnType<(typeof sdkMethod)['getVersionResponse']>['payload']
      >(
        sdkMethod.getVersionRequest(undefined, {
          requestId: generateRequestId()
        }),
        options
      );
    },
    /**
     * Get a list of features that the active public key supports.
     * It can be `sign-deploy`, `sign-transactionv1`, `sign-message`, `sign-typed-data-eip712`, `message-encryption` and `message-decryption`
     * @returns returns array of features that supports the active public key.
     * @throws when wallet is locked (err.code: 1)
     * @throws when active account not approved to connect with the site (err.code: 2)
     */
    getActivePublicKeySupports(): Promise<string[]> {
      return fetchFromBackground<
        ReturnType<
          (typeof sdkMethod)['getActivePublicKeySupportsResponse']
        >['payload']
      >(
        sdkMethod.getActivePublicKeySupportsRequest(undefined, {
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
