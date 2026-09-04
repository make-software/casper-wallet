export enum SwapSteps {
  Form,
  Confirm
}

/** The step a Back press should land on, or `null` to leave the page entirely. */
export const getPreviousSwapStep = (step: SwapSteps): SwapSteps | null =>
  step === SwapSteps.Confirm ? SwapSteps.Form : null;
