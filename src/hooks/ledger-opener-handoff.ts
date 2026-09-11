/** The one opener surface with nothing left to do once the window exists. */
const POPUP_DOMAIN = 'popup.html';

export interface LedgerOpenerHandoffInputs {
  /**
   * `askPermissionUrlData.domain` — the surface the flow continues on, which at
   * every call site is also the surface the opener renders in.
   */
  permissionWindowDomain: string;
  isPermissionWindow: boolean;
}

/**
 * Whether the document that opened the permission window should close itself.
 *
 * The flow runs from here on in the window's document, whose `ledger` service is
 * a different instance — so an opener left standing cannot learn that the device
 * connected, signed or sent, and goes on instructing the user to grant a
 * permission that was granted elsewhere. WALLET-1249, WALLET-1451.
 *
 * Only the popup may go: every popup flow parks its payload before the
 * permission check, so the window finishes alone, success and failure screens
 * included. An approval window is the display of an open dapp request and
 * closing it answers that request (`cancelOpenRequestsForClosedWindow`) — those
 * are taken down at the end instead, by `closeLedgerFlowWindows`.
 */
export function shouldCloseOpenerAfterHandoff({
  permissionWindowDomain,
  isPermissionWindow
}: LedgerOpenerHandoffInputs): boolean {
  if (isPermissionWindow) {
    return false;
  }

  return permissionWindowDomain === POPUP_DOMAIN;
}
