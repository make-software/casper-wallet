import {
  EIP712Error,
  IEIP712TypedData,
  SignTypedDataErrorCodes
} from 'casper-wallet-core';

import { ErrorMessages } from '@src/constants';

import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';
import { eip712Repository } from '@background/signing-repositories';

import { sdkMethod } from '@content/sdk-method';

import { fetchEip712SignatureRequest } from './use-fetch-data-for-eip712-request';

jest.mock('@background/signing-repositories', () => ({
  eip712Repository: { prepareSignatureRequest: jest.fn() }
}));
jest.mock('@background/send-sdk-response-to-specific-tab', () => ({
  sendSdkResponseToSpecificTab: jest.fn()
}));

const prepareSignatureRequest =
  eip712Repository.prepareSignatureRequest as jest.Mock;

const params = {
  typedData: {
    domain: {},
    types: {},
    primaryType: 'Order',
    message: {}
  } as IEIP712TypedData,
  options: { rejectUnknownFields: true },
  signingPublicKeyHex: '01ab',
  requestId: 'request-1',
  requestTabId: 7
};

describe('fetchEip712SignatureRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the prepared signature request', async () => {
    const request = { digest: '0x01' };
    prepareSignatureRequest.mockResolvedValue(request);

    await expect(fetchEip712SignatureRequest(params)).resolves.toBe(request);
    expect(sendSdkResponseToSpecificTab).not.toHaveBeenCalled();
  });

  it('answers the dapp with the typed-data error and core reason when core rejects', async () => {
    const reason = 'Invalid value for Order.details.value: missing';
    prepareSignatureRequest.mockRejectedValue(
      new EIP712Error(
        new Error(reason),
        'validateTypedDataEIP712',
        SignTypedDataErrorCodes.INVALID_PARAMS
      )
    );
    const expected = `${ErrorMessages.signTypedData.INVALID_TYPED_DATA.description} ${reason}`;

    await expect(fetchEip712SignatureRequest(params)).rejects.toThrow(expected);
    expect(sendSdkResponseToSpecificTab).toHaveBeenCalledWith(
      sdkMethod.signTypedDataError(Error(expected), { requestId: 'request-1' }),
      7
    );
  });

  it('answers the dapp without internal detail when the failure is not an EIP712Error', async () => {
    prepareSignatureRequest.mockRejectedValue(new TypeError('x is undefined'));
    const expected = ErrorMessages.signTypedData.INVALID_TYPED_DATA.description;

    await expect(fetchEip712SignatureRequest(params)).rejects.toThrow(expected);
    expect(sendSdkResponseToSpecificTab).toHaveBeenCalledWith(
      sdkMethod.signTypedDataError(Error(expected), { requestId: 'request-1' }),
      7
    );
  });
});
