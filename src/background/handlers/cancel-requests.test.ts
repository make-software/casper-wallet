import { CancellableMethod } from '@background/redux/windowManagement/types';

import { sdkMethod } from '@content/sdk-method';

import { buildCancelResponse } from './cancel-requests';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn() }
}));

describe('buildCancelResponse', () => {
  const c = (m: CancellableMethod) => buildCancelResponse(m, 'r');
  it('connect', () =>
    expect(c('connect')).toEqual(
      sdkMethod.connectResponse(false, { requestId: 'r' })
    ));
  it('switchAccount', () =>
    expect(c('switchAccount')).toEqual(
      sdkMethod.switchAccountResponse(false, { requestId: 'r' })
    ));
  it('sign', () =>
    expect(c('sign')).toEqual(
      sdkMethod.signResponse({ cancelled: true }, { requestId: 'r' })
    ));
  it('signMessage', () =>
    expect(c('signMessage')).toEqual(
      sdkMethod.signMessageResponse({ cancelled: true }, { requestId: 'r' })
    ));
  it('signTypedData', () =>
    expect(c('signTypedData')).toEqual(
      sdkMethod.signTypedDataResponse(
        {
          cancelled: true,
          signature: null,
          digest: null,
          publicKey: null,
          error: null
        },
        { requestId: 'r' }
      )
    ));
  it('decryptMessage', () =>
    expect(c('decryptMessage')).toEqual(
      sdkMethod.decryptMessageResponse({ cancelled: true }, { requestId: 'r' })
    ));
});
