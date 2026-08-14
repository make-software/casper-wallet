import { decideLedgerFlowControl } from './ledger-flow-controls';

describe('decideLedgerFlowControl', () => {
  it('the permission window never dismisses itself', () => {
    expect(decideLedgerFlowControl(true, 9)).toBe('end-flow');
  });

  it('the permission branch does not depend on the id', () => {
    expect(decideLedgerFlowControl(true, null)).toBe('end-flow');
  });

  it('the R8 regression: the approval window dismisses itself, it does not end the flow', () => {
    expect(decideLedgerFlowControl(false, 9)).toBe('dismiss-this-window');
  });

  it('a plain device error still returns to the details screen', () => {
    expect(decideLedgerFlowControl(false, null)).toBe('return-to-main');
  });

  // The reason this takes an owned id rather than `state.ledger.windowId`: with
  // the global slot, a foreign flow holding it turned every one of these into
  // 'dismiss-this-window', and dismissing the request's only display cancels the
  // dapp — reachable from the raw-JSON back arrow with no Ledger error in play.
  it('a foreign flow holding the slot is not this flow, so nothing is dismissed', () => {
    const ownPermissionWindowId = null;

    expect(decideLedgerFlowControl(false, ownPermissionWindowId)).toBe(
      'return-to-main'
    );
  });
});
