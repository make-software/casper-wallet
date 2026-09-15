import { LedgerEventStatus } from 'casper-wallet-core';

import {
  resolveSwapFlowOutcome,
  resolveWrapFlowOutcome
} from '@popup/pages/swap/flow-events';

describe('resolveSwapFlowOutcome', () => {
  it('records the approval leg without entering success', () => {
    expect(
      resolveSwapFlowOutcome({ type: 'approval:sent', hash: 'ab' })
    ).toEqual({ kind: 'sent', hash: 'ab', isSubmitted: false });
  });

  it('enters success only once the swap leg is accepted by a node', () => {
    expect(resolveSwapFlowOutcome({ type: 'swap:sent', hash: 'cd' })).toEqual({
      kind: 'sent',
      hash: 'cd',
      isSubmitted: true
    });
  });

  it('carries the error of a failed leg', () => {
    const error = new Error('boom');

    expect(
      resolveSwapFlowOutcome({ type: 'failed', leg: 'swap', error })
    ).toEqual({ kind: 'failed', error });
  });

  it('reports a cancelled leg as cancelled, never as a failure', () => {
    expect(
      resolveSwapFlowOutcome({ type: 'cancelled', leg: 'approval' })
    ).toEqual({ kind: 'cancelled' });
  });

  it('reports a device prompt separately from progress', () => {
    expect(
      resolveSwapFlowOutcome({
        type: 'ledger',
        event: { status: LedgerEventStatus.SignatureRequestedToUser }
      })
    ).toEqual({ kind: 'ledger' });
  });

  it.each([
    ['approval:checking'],
    ['approval:not-required'],
    ['approval:signing'],
    ['approval:confirmed'],
    ['swap:signing']
  ] as const)('treats %s as progress with nothing to do', type => {
    expect(resolveSwapFlowOutcome({ type })).toEqual({ kind: 'progress' });
  });
});

describe('resolveWrapFlowOutcome', () => {
  it('enters success once the single leg is accepted by a node', () => {
    expect(resolveWrapFlowOutcome({ type: 'wrap:sent', hash: 'ef' })).toEqual({
      kind: 'sent',
      hash: 'ef',
      isSubmitted: true
    });
  });

  it('carries the error of a failed wrap', () => {
    const error = new Error('boom');

    expect(resolveWrapFlowOutcome({ type: 'failed', error })).toEqual({
      kind: 'failed',
      error
    });
  });

  it('reports a cancelled wrap as cancelled, never as a failure', () => {
    expect(resolveWrapFlowOutcome({ type: 'cancelled' })).toEqual({
      kind: 'cancelled'
    });
  });

  it('treats signing as progress with nothing to do', () => {
    expect(resolveWrapFlowOutcome({ type: 'wrap:signing' })).toEqual({
      kind: 'progress'
    });
  });
});
