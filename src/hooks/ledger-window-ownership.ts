/**
 * Which Ledger permission window, if any, the calling `useLedger` instance owns.
 *
 * `state.ledger.windowId` is one global slot, so ownership takes a witness: the
 * instance opened it, IS it, or is the opener's flow remounted. `openerRequestId`
 * is part of it, or a fresh document inherits the previous request's claim.
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

  // `openerWindowId != null` guards the state where neither side is known yet, so
  // `null === null` cannot hand the slot to an instance that witnessed nothing.
  if (
    openerWindowId != null &&
    openerWindowId === hostWindowId &&
    openerRequestId === ownRequestId
  ) {
    return slotWindowId;
  }

  return null;
}
