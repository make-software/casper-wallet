import {
  CORE_ERROR_MESSAGE_KEYS,
  CasperTransactionsError,
  EmptySignatureError,
  InvalidDeployError,
  KeyPairMismatchError,
  LedgerError,
  LedgerEventStatus
} from 'casper-wallet-core';

import { ErrorMessages } from '@src/constants';

import {
  getCoreErrorCopy,
  getTransactionErrorCopy,
  isLedgerFailure
} from './index';

// The pages hand their i18next `t` in; identity keeps the assertions on the copy
// this module picks, not on translation.
const translate = (key: string) => key;

const wrapAsSendFailure = (sourceError: unknown) =>
  new CasperTransactionsError(sourceError, 'sendSignedTransaction');

const rpcFailure = (data?: unknown) =>
  wrapAsSendFailure(
    Object.assign(new Error('HTTP error'), {
      statusCode: 400,
      sourceErr: Object.assign(new Error('deploy is invalid: expired'), {
        code: -32602,
        ...(data === undefined ? {} : { data })
      })
    })
  );

describe('getTransactionErrorCopy', () => {
  it('shows the node message and a string data payload verbatim', () => {
    expect(
      getTransactionErrorCopy(rpcFailure('transaction expired'), translate)
    ).toEqual({
      header: 'deploy is invalid: expired',
      content: 'transaction expired'
    });
  });

  it('drops a non-string data payload rather than stringifying it', () => {
    expect(
      getTransactionErrorCopy(rpcFailure({ reason: 'expired' }), translate)
    ).toEqual({
      header: 'deploy is invalid: expired',
      content: ErrorMessages.common.UNKNOWN_ERROR.description
    });
  });

  it('falls back to the generic description when the node sent no data', () => {
    expect(getTransactionErrorCopy(rpcFailure(), translate)).toEqual({
      header: 'deploy is invalid: expired',
      content: ErrorMessages.common.UNKNOWN_ERROR.description
    });
  });

  it('reaches the transport message when no JSON-RPC error is in the chain', () => {
    const error = wrapAsSendFailure(
      Object.assign(new Error('HTTP error'), {
        statusCode: 502,
        sourceErr: new Error('bad gateway')
      })
    );

    expect(getTransactionErrorCopy(error, translate)).toEqual({
      header: 'bad gateway',
      content: ErrorMessages.common.UNKNOWN_ERROR.description
    });
  });

  it('maps a core error key to wallet copy through the supplied translate fn', () => {
    const copy = getCoreErrorCopy(
      new InvalidDeployError('errors:deploy-rpc-error')
    );

    expect(copy).not.toBeNull();
    expect(
      getTransactionErrorCopy(
        new InvalidDeployError('errors:deploy-rpc-error'),
        translate
      )
    ).toEqual({ header: copy!.message, content: copy!.description });
  });

  it('never leaks a raw core key for a crossed key pair', () => {
    const { header, content } = getTransactionErrorCopy(
      new KeyPairMismatchError(),
      translate
    );

    expect(header).not.toContain('errors:');
    expect(content).not.toContain('errors:');
  });

  it('never leaks a raw core key for an empty signature', () => {
    const { header, content } = getTransactionErrorCopy(
      new EmptySignatureError(),
      translate
    );

    expect(header).not.toContain('errors:');
    expect(content).not.toContain('errors:');
  });

  it('shows an unrecognised message as the header', () => {
    expect(getTransactionErrorCopy(new Error('boom'), translate)).toEqual({
      header: 'boom',
      content: ErrorMessages.common.UNKNOWN_ERROR.description
    });
  });

  it('falls back completely for an empty message', () => {
    expect(getTransactionErrorCopy(new Error(''), translate)).toEqual({
      header: ErrorMessages.common.UNKNOWN_ERROR.message,
      content: ErrorMessages.common.UNKNOWN_ERROR.description
    });
  });

  it.each<[unknown]>([['boom'], [undefined], [null], [{ nope: true }]])(
    'falls back completely for a thrown non-Error (%p)',
    thrown => {
      expect(getTransactionErrorCopy(thrown, translate)).toEqual({
        header: ErrorMessages.common.UNKNOWN_ERROR.message,
        content: ErrorMessages.common.UNKNOWN_ERROR.description
      });
    }
  );
});

describe('getCoreErrorCopy', () => {
  it.each(CORE_ERROR_MESSAGE_KEYS.map(key => [key]))('has copy for %s', key => {
    const copy = getCoreErrorCopy(new Error(key));

    expect(copy).not.toBeNull();
    expect(copy!.message.length).toBeGreaterThan(0);
    expect(copy!.description.length).toBeGreaterThan(0);
    expect(copy!.message).not.toContain('errors:');
    expect(copy!.description).not.toContain('errors:');
  });

  it('returns null for a message that is not a core key', () => {
    expect(getCoreErrorCopy(new Error('boom'))).toBeNull();
    expect(getCoreErrorCopy('boom')).toBeNull();
    expect(getCoreErrorCopy(undefined)).toBeNull();
  });
});

describe('isLedgerFailure', () => {
  it('is true for a Ledger failure, which the Ledger views already render', () => {
    expect(
      isLedgerFailure(
        new LedgerError({ status: LedgerEventStatus.SignatureCanceled })
      )
    ).toBe(true);
  });

  it.each<[unknown]>([
    [new KeyPairMismatchError()],
    [new Error('boom')],
    ['boom'],
    [undefined]
  ])('is false for %p', thrown => {
    expect(isLedgerFailure(thrown)).toBe(false);
  });
});
