import { SwapFlowOutcome } from './flow-events';
import { ILedgerSwapPayload } from './ledger-trade';

/**
 * What the parked Ledger swap payload should become after a flow outcome, given what is
 * currently parked. Only the approval leg re-parks, carrying its hash so a re-hydrated retry
 * waits for it rather than paying for a second one. `null` clears the park; `undefined` leaves
 * it as is.
 */
export const resolveParkedSwapPayload = (
  outcome: SwapFlowOutcome,
  parked: ILedgerSwapPayload | null,
  isDeploy: boolean
): ILedgerSwapPayload | null | undefined => {
  if (outcome.kind === 'cancelled') {
    return null;
  }

  if (outcome.kind !== 'sent') {
    return undefined;
  }

  if (outcome.isSubmitted) {
    return null;
  }

  if (parked?.kind !== 'swap') {
    return undefined;
  }

  return {
    ...parked,
    pendingApproval: { hash: outcome.hash, isDeploy }
  };
};
