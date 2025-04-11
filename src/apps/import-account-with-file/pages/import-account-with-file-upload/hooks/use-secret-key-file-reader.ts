import { isError } from 'casper-wallet-core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorMessages } from '@src/constants';

import { checkSecretKeyExist } from '@background/redux/import-account-actions-should-be-removed';

import { parseSecretKeyString } from '@libs/crypto';
import { Account } from '@libs/types/account';

type OnSuccess = (accountData: Account) => void;
type OnFailure = (message?: string) => void;

interface UseSecretKeyFileReaderProps {
  onSuccess: OnSuccess;
  onFailure: OnFailure;
}

export function useSecretKeyFileReader({
  onSuccess,
  onFailure
}: UseSecretKeyFileReaderProps) {
  const { t } = useTranslation();

  const secretKeyFileReader = useCallback(
    async (name: string, secretKeyFile: Blob) => {
      const isFileValid = (fileContents: string): Error | undefined => {
        if (!fileContents || fileContents.includes('PUBLIC KEY')) {
          return new Error(
            t(ErrorMessages.secretKeyFile.INVALID_FILE_CONTENTS.description)
          );
        }
      };

      const doesSecretKeyExist = async (
        secretKeyBase64: string
      ): Promise<Error | undefined> => {
        const existence =
          secretKeyBase64 && (await checkSecretKeyExist(secretKeyBase64));
        if (existence) {
          return new Error(
            t(ErrorMessages.secretKeyFile.ACCOUNT_EXISTS.description)
          );
        }
      };

      const reader = new FileReader();

      reader.readAsText(secretKeyFile);

      reader.onload = async () => {
        const fileContents = reader.result as string;

        const fileValidationError = isFileValid(fileContents);

        if (fileValidationError) {
          return onFailure(fileValidationError.message);
        }

        try {
          const { publicKeyHex, secretKeyBase64 } =
            parseSecretKeyString(fileContents);

          const secretKeyError = await doesSecretKeyExist(secretKeyBase64);

          if (secretKeyError) {
            return onFailure(secretKeyError.message);
          }

          return onSuccess({
            imported: true,
            name: name.trim(),
            publicKey: publicKeyHex,
            secretKey: secretKeyBase64,
            hidden: false
          });
        } catch (e) {
          return onFailure(
            isError(e)
              ? e.message
              : t(ErrorMessages.secretKeyFile.PARSING_ERROR.description)
          );
        }
      };
    },
    [t, onSuccess, onFailure]
  );

  return { secretKeyFileReader };
}
