import { SdkMethod } from '@content/sdk-method';

// SECURITY: identifiers only — an SDK action's payload can carry signature
// material, and these messages cross into the dapp's own SDK via `sendError`.

// `requestId` stays: the correlation key at this layer, and the error rejects
// the originating dapp's own promise, so the receiver already has it.
export function unknownSdkMessageError(action: SdkMethod): Error {
  return Error(
    `Background: Unknown sdk message: ${action.type} (requestId ${action.meta.requestId})`
  );
}

// The signal for a missing entry in the forwarding allow-list.
export function unknownReduxActionError(action: { type: string }): Error {
  return Error(`Background: Unknown redux action: ${action.type}`);
}

// Every message reaching this branch lacks a string `type` by definition, so
// report what `type` was: it distinguishes a missing field from a non-string one.
export function unknownMessageError(
  action: { type?: unknown } | undefined
): Error {
  return Error(`Background: Unknown message: type is ${typeof action?.type}`);
}
