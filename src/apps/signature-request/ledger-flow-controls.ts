export interface LedgerFlowControlEffects {
  returnToMain: () => void;
  dismissThisWindow: () => void;
  endLedgerFlow: () => void;
}

// The permission window is `type: 'normal'`, so it cannot close itself and its
// controls must stay the flow's teardown.
// `permissionWindowId` is a single global slot, so a foreign Ledger flow holding it
// makes the dismiss branch fire for a request that has no permission window of its own.
export function runLedgerFlowControl(
  isPermissionWindow: boolean,
  permissionWindowId: number | null,
  effects: LedgerFlowControlEffects
): void {
  if (isPermissionWindow) {
    effects.returnToMain();
    effects.endLedgerFlow();
    return;
  }

  if (permissionWindowId != null) {
    effects.dismissThisWindow();
    return;
  }

  effects.returnToMain();
}
