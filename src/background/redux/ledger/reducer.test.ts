import {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared,
  ledgerSwapPayloadChanged,
  ledgerTransactionChanged
} from './actions';
import { reducer } from './reducer';

describe('ledger reducer', () => {
  const initialState = {
    windowId: null,
    openerWindowId: null,
    openerRequestId: null,
    deploy: null,
    transaction: null,
    recipientToSaveOnSuccess: null,
    swapPayload: null
  };

  it('has the expected initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual(initialState);
  });

  it('sets windowId and both opener witnesses together on ledgerNewWindowIdChanged', () => {
    expect(
      reducer(
        initialState,
        ledgerNewWindowIdChanged({
          windowId: 7,
          openerWindowId: 3,
          openerRequestId: 'r1'
        })
      )
    ).toEqual({
      ...initialState,
      windowId: 7,
      openerWindowId: 3,
      openerRequestId: 'r1'
    });
  });

  it('a new slot without a known opener clears the previous opener, request id included', () => {
    const withOpener = {
      ...initialState,
      windowId: 7,
      openerWindowId: 3,
      openerRequestId: 'r1'
    };
    expect(
      reducer(
        withOpener,
        ledgerNewWindowIdChanged({
          windowId: 8,
          openerWindowId: null,
          openerRequestId: null
        })
      )
    ).toEqual({
      ...initialState,
      windowId: 8,
      openerWindowId: null,
      openerRequestId: null
    });
  });

  it('sets deploy on ledgerDeployChanged', () => {
    expect(
      reducer(initialState, ledgerDeployChanged('deploy-payload'))
    ).toEqual({ ...initialState, deploy: 'deploy-payload' });
  });

  it('sets transaction on ledgerTransactionChanged', () => {
    expect(
      reducer(initialState, ledgerTransactionChanged('tx-payload'))
    ).toEqual({ ...initialState, transaction: 'tx-payload' });
  });

  it('sets recipientToSaveOnSuccess on ledgerRecipientToSaveOnSuccessChanged', () => {
    expect(
      reducer(initialState, ledgerRecipientToSaveOnSuccessChanged('01deadbeef'))
    ).toEqual({ ...initialState, recipientToSaveOnSuccess: '01deadbeef' });
  });

  it('sets swapPayload on ledgerSwapPayloadChanged', () => {
    expect(
      reducer(initialState, ledgerSwapPayloadChanged('{"kind":"swap"}'))
    ).toEqual({ ...initialState, swapPayload: '{"kind":"swap"}' });
  });

  it('clears the parked swap when a transaction is parked instead', () => {
    const parkedSwap = { ...initialState, swapPayload: '{"kind":"swap"}' };

    expect(reducer(parkedSwap, ledgerTransactionChanged('tx-payload'))).toEqual(
      { ...initialState, transaction: 'tx-payload' }
    );
    expect(reducer(parkedSwap, ledgerDeployChanged('deploy-payload'))).toEqual({
      ...initialState,
      deploy: 'deploy-payload'
    });
  });

  it('clears a parked transaction when a swap is parked instead', () => {
    const parkedTransfer = {
      ...initialState,
      deploy: 'deploy-payload',
      transaction: 'tx-payload',
      recipientToSaveOnSuccess: '01deadbeef'
    };

    expect(
      reducer(parkedTransfer, ledgerSwapPayloadChanged('{"kind":"swap"}'))
    ).toEqual({ ...initialState, swapPayload: '{"kind":"swap"}' });
  });

  it('keeps the transaction pair intact across the three parks a transfer makes', () => {
    const parked = [
      ledgerTransactionChanged('tx-payload'),
      ledgerDeployChanged('deploy-payload'),
      ledgerRecipientToSaveOnSuccessChanged('01deadbeef')
    ].reduce(reducer, initialState);

    expect(parked).toEqual({
      ...initialState,
      transaction: 'tx-payload',
      deploy: 'deploy-payload',
      recipientToSaveOnSuccess: '01deadbeef'
    });
  });

  it('drops the parked swap on ledgerSwapPayloadChanged(null)', () => {
    expect(
      reducer(
        { ...initialState, windowId: 7, swapPayload: '{"kind":"swap"}' },
        ledgerSwapPayloadChanged(null)
      )
    ).toEqual({ ...initialState, windowId: 7 });
  });

  it('resets to initial state on ledgerStateCleared', () => {
    const populated = {
      windowId: 7,
      openerWindowId: 3,
      openerRequestId: 'r1',
      deploy: 'deploy-payload',
      transaction: 'tx-payload',
      recipientToSaveOnSuccess: '01deadbeef',
      swapPayload: '{"kind":"swap"}'
    };
    expect(reducer(populated, ledgerStateCleared())).toEqual(initialState);
  });
});
