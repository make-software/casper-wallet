import { useQuery } from '@tanstack/react-query';
import {
  IEIP712SignTypedDataOptions,
  IEIP712TypedData
} from 'casper-wallet-core';

import { ErrorMessages } from '@src/constants';

import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';
import { eip712Repository } from '@background/wallet-repositories';

import { sdkMethod } from '@content/sdk-method';

interface IUseFetchDataForEip712RequestParams {
  typedData?: IEIP712TypedData;
  options?: IEIP712SignTypedDataOptions;
  signingPublicKeyHex: string;
  requestId: string;
  requestTabId: number;
}

export const useFetchDataForEip712Request = ({
  typedData,
  options,
  signingPublicKeyHex,
  requestId,
  requestTabId
}: IUseFetchDataForEip712RequestParams) => {
  const { data: signatureRequest, isFetching: isLoadingSignatureRequest } =
    useQuery({
      queryKey: [
        'FetchDataForEip712Request',
        typedData,
        signingPublicKeyHex,
        requestId
      ],
      queryFn: async () => {
        try {
          if (typedData) {
            return eip712Repository.prepareSignatureRequest({
              typedData,
              signingPublicKeyHex,
              options,
              withProxyHeader: false
            });
          }
        } catch (e) {
          const error = Error(
            ErrorMessages.signTransaction.INVALID_TRANSACTION_JSON.description
          );
          sendSdkResponseToSpecificTab(
            sdkMethod.signTypedDataEIP712Error(error, { requestId }),
            requestTabId
          );
          throw error;
        }
      },
      enabled: Boolean(typedData && signingPublicKeyHex),
      refetchInterval: false,
      throwOnError: true
    });

  return { signatureRequest, isLoadingSignatureRequest };
};
