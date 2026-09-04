import { SwapSteps, getPreviousSwapStep } from './utils';

describe('getPreviousSwapStep', () => {
  it('returns to the form from confirm', () => {
    expect(getPreviousSwapStep(SwapSteps.Confirm)).toBe(SwapSteps.Form);
  });

  it('leaves the page from the form', () => {
    expect(getPreviousSwapStep(SwapSteps.Form)).toBeNull();
  });
});
