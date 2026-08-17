import {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared,
  ledgerTransactionChanged
} from './actions';
import { reducer } from './reducer';

describe('ledger reducer', () => {
  const initialState = {
    windowId: null,
    openerWindowId: null,
    deploy: null,
    transaction: null,
    recipientToSaveOnSuccess: null
  };

  it('has the expected initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual(initialState);
  });

  it('sets windowId and openerWindowId together on ledgerNewWindowIdChanged', () => {
    expect(
      reducer(
        initialState,
        ledgerNewWindowIdChanged({ windowId: 7, openerWindowId: 3 })
      )
    ).toEqual({ ...initialState, windowId: 7, openerWindowId: 3 });
  });

  it('a new slot without a known opener clears the previous opener', () => {
    const withOpener = { ...initialState, windowId: 7, openerWindowId: 3 };
    expect(
      reducer(
        withOpener,
        ledgerNewWindowIdChanged({ windowId: 8, openerWindowId: null })
      )
    ).toEqual({ ...initialState, windowId: 8, openerWindowId: null });
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

  it('resets to initial state on ledgerStateCleared', () => {
    const populated = {
      windowId: 7,
      openerWindowId: 3,
      deploy: 'deploy-payload',
      transaction: 'tx-payload',
      recipientToSaveOnSuccess: '01deadbeef'
    };
    expect(reducer(populated, ledgerStateCleared())).toEqual(initialState);
  });
});
