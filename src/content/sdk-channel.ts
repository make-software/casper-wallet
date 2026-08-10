// Shared constants + trust guard for the private SDK <-> content-script
// MessageChannel handshake.
//
// The page main world (where `sdk.bundle.js` runs) is shared between the dapp
// and any other same-origin script. The handshake below cannot cryptographically
// isolate the SDK from a co-resident same-origin script that races it — that is
// an unavoidable property of MV3 page-world injection. What it DOES buy is:
//   - rejecting cross-origin / cross-window (iframe, other-window) messages via
//     the source + origin check below;
//   - moving the request/response payloads off the public, forgeable window
//     CustomEvent bus onto a transferred `MessagePort` capability.
export const SDK_HANDSHAKE_TYPE = 'CasperWalletProvider:Handshake';

// A trusted window message must originate from THIS window (not an iframe or
// another window handle) AND from this document's own origin.
export function isTrustedWindowMessage(e: MessageEvent): boolean {
  return e.source === window && e.origin === window.location.origin;
}
