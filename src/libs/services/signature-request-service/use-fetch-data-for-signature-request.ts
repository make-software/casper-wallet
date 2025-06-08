import { useQuery } from '@tanstack/react-query';
import { Transaction } from 'casper-js-sdk';

import { ErrorMessages } from '@src/constants';

import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';
import { txSignatureRequestRepository } from '@background/wallet-repositories';

import { sdkMethod } from '@content/sdk-method';

interface IUseFetchDataForSignatureRequestParams {
  signingPublicKeyHex: string;
  requestId: string;
  transactionJson?: string;
  onTransactionParsed?: (tx: Transaction) => void;
}

export const useFetchDataForSignatureRequest = ({
  requestId,
  transactionJson,
  signingPublicKeyHex,
  onTransactionParsed
}: IUseFetchDataForSignatureRequestParams) => {
  const { data: signatureRequest, isFetching: isLoadingSignatureRequest } =
    useQuery({
      queryKey: [
        'FetchDataForSignatureRequest',
        transactionJson,
        signingPublicKeyHex,
        requestId
      ],
      queryFn: async () => {
        try {
          if (transactionJson) {
            const tx = Transaction.fromJSON(transactionJson);
            onTransactionParsed && onTransactionParsed(tx);

            return txSignatureRequestRepository.prepareSignatureRequest({
              transactionJson,
              signingPublicKeyHex,
              withProxyHeader: false
            });
          }
        } catch (e) {
          const error = Error(
            ErrorMessages.signTransaction.INVALID_TRANSACTION_JSON.description
          );
          sendSdkResponseToSpecificTab(
            sdkMethod.signError(error, { requestId })
          );
          throw error;
        }
      },
      enabled: Boolean(transactionJson && signingPublicKeyHex),
      refetchInterval: false,
      throwOnError: true
    });

  return {
    signatureRequest,
    isLoadingSignatureRequest
  };
};
