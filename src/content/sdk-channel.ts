// Trust guard for the private SDK <-> content-script MessageChannel handshake:
// rejects cross-origin / cross-window messages, but not a same-origin script.
export const SDK_HANDSHAKE_TYPE = 'CasperWalletProvider:Handshake';

export function isTrustedWindowMessage(e: MessageEvent): boolean {
  return e.source === window && e.origin === window.location.origin;
}
