import { assertNever, decideLedgerFlowControl } from './ledger-flow-controls';

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

  // With the global `state.ledger.windowId`, a foreign flow's id would dismiss this request.
  it('a foreign flow holding the slot is not this flow, so nothing is dismissed', () => {
    const ownPermissionWindowId = null;

    expect(decideLedgerFlowControl(false, ownPermissionWindowId)).toBe(
      'return-to-main'
    );
  });
});

describe('assertNever', () => {
  it('throws for a value that escaped the union at runtime', () => {
    expect(() => assertNever('stray' as never)).toThrow(
      'Unhandled ledger flow decision: stray'
    );
  });
});
