import { SdkMethod } from '@content/sdk-method';

// SECURITY: identifiers only — an SDK action's payload can carry signature
// material, and these messages cross the boundary via `sendError`: to
// `dispatchToMainStore` for the redux branch, into the dapp's own SDK for the
// sdk branch. Constructed here rather than inline in `index.ts` so a test can
// hold the redaction in place — that entry point is imported by no test and sits
// outside `collectCoverageFrom`, the same reasoning that moved the
// `windows.onRemoved` body into `window-removed.ts`.

// `requestId` stays: it is the correlation key every other log at this layer
// uses, and this error rejects the originating dapp's own promise, so the value
// is already known to the receiver. `isSDKMethod` guarantees both fields are
// strings.
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
// `typeof action` would always say 'object'. Report what `type` actually was —
// equally non-revealing, and it distinguishes a missing field from a non-string
// one.
export function unknownMessageError(
  action: { type?: unknown } | undefined
): Error {
  return Error(`Background: Unknown message: type is ${typeof action?.type}`);
}
