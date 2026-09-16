export type LedgerFlowControlDecision =
  'end-flow' | 'dismiss-this-window' | 'return-to-main';

// `ownPermissionWindowId` must be THIS flow's window: `state.ledger.windowId` is one global slot,
// so a foreign flow holding it would fire the dismiss branch for a request with no window.
export function decideLedgerFlowControl(
  isPermissionWindow: boolean,
  ownPermissionWindowId: number | null
): LedgerFlowControlDecision {
  // The permission window is `type: 'normal'`, so it cannot close itself.
  if (isPermissionWindow) {
    return 'end-flow';
  }

  return ownPermissionWindowId != null
    ? 'dismiss-this-window'
    : 'return-to-main';
}

// A new member of the union without a case is then a compile error, not a silent fall-through.
export function assertNever(decision: never): never {
  throw new Error(`Unhandled ledger flow decision: ${String(decision)}`);
}
