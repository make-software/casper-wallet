import { SdkEvent } from './sdk-event';
import { SdkMethod } from './sdk-method';

// SECURITY: type only, never the envelope — these carry signatureHex /
// encryptedMessage, and a content script's console is the DAPP PAGE's console.

export function unknownSdkMessageError(message: SdkMethod): Error {
  return Error(`Content: handleOnMessage unknown sdk message: ${message.type}`);
}

export function unknownSdkEventError(message: SdkEvent): Error {
  return Error(`Content: emit sdk event unknown action: ${message.type}`);
}
