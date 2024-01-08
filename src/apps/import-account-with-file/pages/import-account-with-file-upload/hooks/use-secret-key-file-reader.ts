import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { checkSecretKeyExist } from '@background/redux/import-account-actions-should-be-removed';
import { Account } from '@background/redux/vault/types';

import { parseSecretKeyString } from '@libs/crypto';

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
    (name: string, secretKeyFile: Blob) => {
      const reader = new FileReader();
      reader.readAsText(secretKeyFile);

      reader.onload = async () => {
        const fileContents = reader.result as string;

        try {
          if (!fileContents || fileContents.includes('PUBLIC KEY')) {
            throw Error(
              t(
                'A private key was not detected. Try importing a different file.'
              )
            );
          }

          const { publicKeyHex, secretKeyBase64 } =
            parseSecretKeyString(fileContents);

          const doesSecretKeyExist =
            secretKeyBase64 && (await checkSecretKeyExist(secretKeyBase64));
          if (doesSecretKeyExist) {
            throw Error(
              t('This account already exists. Try importing a different file.')
            );
          }

          return onSuccess({
            imported: true,
            name,
            publicKey: publicKeyHex,
            secretKey: secretKeyBase64
          });
        } catch (err) {
          if (err instanceof Error) {
            return onFailure(err.message);
          } else {
            console.error(err);
          }
        }
      };
    },
    [t, onFailure, onSuccess]
  );

  return { secretKeyFileReader };
}
