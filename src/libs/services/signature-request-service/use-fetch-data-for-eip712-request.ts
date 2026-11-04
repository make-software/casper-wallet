import { useQuery } from '@tanstack/react-query';
import {
  IEIP712SignTypedDataOptions,
  IEIP712TypedData,
  isEIP712Error
} from 'casper-wallet-core';

import { ErrorMessages } from '@src/constants';

import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';
import { eip712Repository } from '@background/signing-repositories';

import { sdkMethod } from '@content/sdk-method';

interface IUseFetchDataForEip712RequestParams {
  typedData?: IEIP712TypedData;
  options?: IEIP712SignTypedDataOptions;
  signingPublicKeyHex: string;
  requestId: string;
  requestTabId: number;
}

/**
 * Builds the signature request for `typedData`. When core rejects the typed data, the dapp is
 * answered with `signTypedDataError` and core's reason, and the returned promise rejects with
 * wallet text only: core's reason quotes dapp strings, which must not reach the wallet's error page.
 */
export async function fetchEip712SignatureRequest({
  typedData,
  options,
  signingPublicKeyHex,
  requestId,
  requestTabId
}: IUseFetchDataForEip712RequestParams) {
  try {
    if (typedData) {
      return await eip712Repository.prepareSignatureRequest({
        typedData,
        signingPublicKeyHex,
        options,
        withProxyHeader: false
      });
    }
  } catch (e) {
    // Core's reason describes only the dapp's own payload, so it is safe to return to the dapp.
    const { description } = ErrorMessages.signTypedData.INVALID_TYPED_DATA;
    const dappError = Error(
      isEIP712Error(e) ? `${description} ${e.message}` : description
    );
    sendSdkResponseToSpecificTab(
      sdkMethod.signTypedDataError(dappError, { requestId }),
      requestTabId
    );
    throw Error(description);
  }
}

export const useFetchDataForEip712Request = (
  params: IUseFetchDataForEip712RequestParams
) => {
  const { typedData, signingPublicKeyHex, requestId } = params;
  const { data: signatureRequest, isFetching: isLoadingSignatureRequest } =
    useQuery({
      queryKey: [
        'FetchDataForEip712Request',
        typedData,
        signingPublicKeyHex,
        requestId
      ],
      queryFn: () => fetchEip712SignatureRequest(params),
      enabled: Boolean(typedData && signingPublicKeyHex),
      refetchInterval: false,
      throwOnError: true
    });

  return { signatureRequest, isLoadingSignatureRequest };
};
