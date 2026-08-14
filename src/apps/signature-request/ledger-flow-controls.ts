export type LedgerFlowControlDecision =
  'end-flow' | 'dismiss-this-window' | 'return-to-main';

// Returns the decision instead of invoking effects: the callers are two pages
// that cannot be rendered by any test in this tree, and an effects object of
// three `() => void` members type-checks under every permutation of its bodies.
//
// `ownPermissionWindowId` must be THIS flow's window, not `state.ledger.windowId`
// — that is one global slot, so a foreign Ledger flow holding it would make the
// dismiss branch fire for a request that has no permission window of its own.
export function decideLedgerFlowControl(
  isPermissionWindow: boolean,
  ownPermissionWindowId: number | null
): LedgerFlowControlDecision {
  // The permission window is `type: 'normal'`, so it cannot close itself and its
  // controls must stay the flow's teardown.
  if (isPermissionWindow) {
    return 'end-flow';
  }

  return ownPermissionWindowId != null
    ? 'dismiss-this-window'
    : 'return-to-main';
}
