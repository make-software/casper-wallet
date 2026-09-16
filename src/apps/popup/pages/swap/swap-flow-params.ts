import { IStartSwapFlowParams } from 'casper-wallet-core';

import { ILedgerSwapPayload } from './ledger-trade';

/**
 * The swap flow's start params for a swap payload — parked for a re-hydration or held in the
 * popup's own retry — carrying any recorded approval forward so the flow waits for it instead of
 * submitting a second one. `pendingApproval` is omitted, not `undefined`-valued, when none is
 * recorded.
 */
export const toStartSwapFlowParams = (
  payload: Extract<ILedgerSwapPayload, { kind: 'swap' }>
): IStartSwapFlowParams => ({
  ...payload.trade,
  slippage: payload.slippage,
  deadline: payload.deadline,
  awaitSettlement: false,
  ...(payload.pendingApproval
    ? { pendingApproval: payload.pendingApproval }
    : {})
});
