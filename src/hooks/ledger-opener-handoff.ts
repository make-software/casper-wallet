const POPUP_DOMAIN = 'popup.html';
const APPROVAL_DOMAIN = 'signature-request.html';

export type LedgerOpenerHandoff =
  'close-popup' | 'close-approval-window' | 'keep';

export interface LedgerOpenerHandoffInputs {
  /** `askPermissionUrlData.domain`, which at every call site is the opener's own surface too. */
  permissionWindowDomain: string;
  isPermissionWindow: boolean;
  /** The permission window is a display of the opener's request — `registerLedgerPermissionWindow` resolved true. */
  permissionWindowAttached: boolean;
}

/**
 * What the document that opened the permission window should do with itself.
 *
 * The flow continues in that window, so an opener left standing goes on demanding
 * a permission granted elsewhere. An approval window may go only once
 * `permissionWindowAttached`: closing a request's last display cancels the dapp.
 */
export function decideOpenerHandoff({
  permissionWindowDomain,
  isPermissionWindow,
  permissionWindowAttached
}: LedgerOpenerHandoffInputs): LedgerOpenerHandoff {
  if (isPermissionWindow) {
    return 'keep';
  }

  if (permissionWindowDomain === POPUP_DOMAIN) {
    return 'close-popup';
  }

  return permissionWindowDomain === APPROVAL_DOMAIN && permissionWindowAttached
    ? 'close-approval-window'
    : 'keep';
}
