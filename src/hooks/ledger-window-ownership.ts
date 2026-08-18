/**
 * Which Ledger permission window, if any, the calling `useLedger` instance owns.
 *
 * `state.ledger.windowId` is one global slot, so it alone cannot tell "my
 * window" from a foreign flow's. Three witnesses can, and an instance owns the
 * slot's window when any of them holds:
 *
 * - it opened that window (`openedWindowId`, a per-document ref);
 * - it IS that window (`hostWindowId === slotWindowId`);
 * - it is the same flow as the opener, remounted (`openerWindowId` +
 *   `openerRequestId`, persisted in the slice next to `windowId`). The popup
 *   document is torn down when the permission window takes focus, so a reopened
 *   popup on the Ledger screen is neither of the first two.
 *
 * The remount witness takes BOTH halves. A browser window outlives the document
 * that recorded it, and dapp approval windows are a single slot the next request
 * reuses in place (`create-open-window.ts` retargets the tab's URL), so the
 * window id alone lets a fresh document inherit the previous request's claim —
 * which is the collateral-cancel class WALLET-1416 exists to close. The request
 * id separates two flows sharing one window; both being `null` is a match on
 * purpose, because that is the internal flows (`import-account-from-ledger`,
 * `sign-with-ledger-in-new-window`), which have no dapp request behind them and
 * render one document per browser window.
 *
 * Extracted from the hook because the repo has no React-hook harness; the
 * hook's early return on `null` is what leaves a control dead.
 */
export interface LedgerWindowWitnesses {
  slotWindowId: number | null;
  openerWindowId: number | null;
  openerRequestId: string | null;
  openedWindowId: number | null;
  hostWindowId: number | null;
  ownRequestId: string | null;
}

export function resolveOwnPermissionWindowId({
  slotWindowId,
  openerWindowId,
  openerRequestId,
  openedWindowId,
  hostWindowId,
  ownRequestId
}: LedgerWindowWitnesses): number | null {
  if (slotWindowId == null) {
    return null;
  }

  if (slotWindowId === openedWindowId || slotWindowId === hostWindowId) {
    return slotWindowId;
  }

  // `openerWindowId != null` guards the state where neither side is known yet:
  // the slice has no opener recorded and `windows.getCurrent()` has not resolved
  // here, so `null === null` would hand the slot to an instance that witnessed
  // nothing.
  if (
    openerWindowId != null &&
    openerWindowId === hostWindowId &&
    openerRequestId === ownRequestId
  ) {
    return slotWindowId;
  }

  return null;
}
