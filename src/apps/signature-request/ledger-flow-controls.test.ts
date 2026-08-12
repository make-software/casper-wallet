import { runLedgerFlowControl } from './ledger-flow-controls';

const makeEffects = () => ({
  returnToMain: jest.fn(),
  dismissThisWindow: jest.fn(),
  endLedgerFlow: jest.fn()
});

describe('runLedgerFlowControl', () => {
  it('the permission window never dismisses itself', () => {
    const effects = makeEffects();

    runLedgerFlowControl(true, 9, effects);

    expect(effects.returnToMain).toHaveBeenCalledTimes(1);
    expect(effects.endLedgerFlow).toHaveBeenCalledTimes(1);
    expect(effects.dismissThisWindow).not.toHaveBeenCalled();
  });

  it('the R8 regression: the approval window dismisses itself and does NOT end the flow', () => {
    const effects = makeEffects();

    runLedgerFlowControl(false, 9, effects);

    expect(effects.dismissThisWindow).toHaveBeenCalledTimes(1);
    expect(effects.endLedgerFlow).not.toHaveBeenCalled();
  });

  it('a plain device error still returns to the details screen', () => {
    const effects = makeEffects();

    runLedgerFlowControl(false, null, effects);

    expect(effects.returnToMain).toHaveBeenCalledTimes(1);
    expect(effects.dismissThisWindow).not.toHaveBeenCalled();
    expect(effects.endLedgerFlow).not.toHaveBeenCalled();
  });

  it('the permission branch does not depend on the slot', () => {
    const effects = makeEffects();

    runLedgerFlowControl(true, null, effects);

    expect(effects.returnToMain).toHaveBeenCalledTimes(1);
    expect(effects.endLedgerFlow).toHaveBeenCalledTimes(1);
    expect(effects.dismissThisWindow).not.toHaveBeenCalled();
  });

  it('exactly one path runs for each input', () => {
    const cases: Array<{
      isPermissionWindow: boolean;
      permissionWindowId: number | null;
      expected: [number, number, number];
    }> = [
      { isPermissionWindow: true, permissionWindowId: 9, expected: [1, 0, 1] },
      { isPermissionWindow: false, permissionWindowId: 9, expected: [0, 1, 0] },
      {
        isPermissionWindow: false,
        permissionWindowId: null,
        expected: [1, 0, 0]
      },
      {
        isPermissionWindow: true,
        permissionWindowId: null,
        expected: [1, 0, 1]
      }
    ];

    for (const { isPermissionWindow, permissionWindowId, expected } of cases) {
      const effects = makeEffects();

      runLedgerFlowControl(isPermissionWindow, permissionWindowId, effects);

      expect(effects.returnToMain).toHaveBeenCalledTimes(expected[0]);
      expect(effects.dismissThisWindow).toHaveBeenCalledTimes(expected[1]);
      expect(effects.endLedgerFlow).toHaveBeenCalledTimes(expected[2]);
    }
  });
});
