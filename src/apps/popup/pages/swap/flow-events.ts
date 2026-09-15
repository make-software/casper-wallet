import { SwapFlowEvent, WrapFlowEvent } from 'casper-wallet-core';

/**
 * What a view must do about one event of a running swap or wrap flow.
 *
 * `sent` carries `isSubmitted` because a swap has two `*:sent` events and only the second one
 * means the trade went out — the success screen gates on it.
 */
export type SwapFlowOutcome =
  | { kind: 'progress' }
  | { kind: 'ledger' }
  | { kind: 'sent'; hash: string; isSubmitted: boolean }
  | { kind: 'cancelled' }
  | { kind: 'failed'; error: unknown };

export const resolveSwapFlowOutcome = (
  event: SwapFlowEvent
): SwapFlowOutcome => {
  switch (event.type) {
    case 'approval:sent':
      return { kind: 'sent', hash: event.hash, isSubmitted: false };
    case 'swap:sent':
      return { kind: 'sent', hash: event.hash, isSubmitted: true };
    case 'ledger':
      return { kind: 'ledger' };
    case 'cancelled':
      return { kind: 'cancelled' };
    case 'failed':
      return { kind: 'failed', error: event.error };
    default:
      return { kind: 'progress' };
  }
};

/** See {@link resolveSwapFlowOutcome} — the wrap flow's single leg is judged the same way. */
export const resolveWrapFlowOutcome = (
  event: WrapFlowEvent
): SwapFlowOutcome => {
  switch (event.type) {
    case 'wrap:sent':
      return { kind: 'sent', hash: event.hash, isSubmitted: true };
    case 'ledger':
      return { kind: 'ledger' };
    case 'cancelled':
      return { kind: 'cancelled' };
    case 'failed':
      return { kind: 'failed', error: event.error };
    default:
      return { kind: 'progress' };
  }
};
