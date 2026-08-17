import { SdkEvent } from './sdk-event';
import { SdkMethod } from './sdk-method';

// SECURITY: type only, never the envelope — these carry signatureHex /
// encryptedMessage, and a content script's console is the DAPP PAGE's console.
// The constructions live here rather than inline in `index.ts` because that
// module is imported by no test that reaches its `default` branches, so nothing
// would hold the redaction in place. The background's delivery-failure log
// re-uses `unknownSdkMessageError` as its rejection fixture: the polyfill relays
// a listener's `Error.message` verbatim to the sender, so this text lands in a
// background log too, and that test fails if the redaction here regresses.

export function unknownSdkMessageError(message: SdkMethod): Error {
  return Error(`Content: handleOnMessage unknown sdk message: ${message.type}`);
}

export function unknownSdkEventError(message: SdkEvent): Error {
  return Error(`Content: emit sdk event unknown action: ${message.type}`);
}
