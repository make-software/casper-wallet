/**
 * Which Ledger permission window, if any, the calling `useLedger` instance owns.
 *
 * `state.ledger.windowId` is one global slot, so it alone cannot tell "my
 * window" from a foreign flow's. Three witnesses can, and an instance owns the
 * slot's window when any of them holds:
 *
 * - it opened that window (`openedWindowId`, a per-document ref);
 * - it IS that window (`hostWindowId === slotWindowId`);
 * - it renders in the same window the opener did (`openerWindowId`, persisted
 *   in the slice next to `windowId`) — the witness that survives a remount. The
 *   popup document is torn down when the permission window takes focus, so a
 *   reopened popup on the Ledger screen is neither of the first two.
 *
 * Extracted from the hook because the repo has no React-hook harness; the
 * hook's early return on `null` is what leaves a control dead.
 */
export interface LedgerWindowWitnesses {
  slotWindowId: number | null;
  openerWindowId: number | null;
  openedWindowId: number | null;
  hostWindowId: number | null;
}

export function resolveOwnPermissionWindowId({
  slotWindowId,
  openerWindowId,
  openedWindowId,
  hostWindowId
}: LedgerWindowWitnesses): number | null {
  if (slotWindowId == null) {
    return null;
  }

  if (slotWindowId === openedWindowId || slotWindowId === hostWindowId) {
    return slotWindowId;
  }

  if (openerWindowId != null && openerWindowId === hostWindowId) {
    return slotWindowId;
  }

  return null;
}
