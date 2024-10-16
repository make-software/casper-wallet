import { useCallback } from 'react';

import { checkSecretKeyExist } from '@background/redux/import-account-actions-should-be-removed';

import { parseSecretKeyStringSecp } from '@libs/crypto/parse-secret-key-string-secp';
import { Account } from '@libs/types/account';

export enum ImportAccountSteps {
  Instruction = 'instruction',
  Form = 'form',
  Success = 'success',
  Failure = 'failure'
}

const doesSecretKeyExist = async (
  secretKeyBase64: string
): Promise<Error | undefined> => {
  const existence =
    secretKeyBase64 && (await checkSecretKeyExist(secretKeyBase64));
  if (existence) {
    return new Error('This account already exists.');
  }
};

type OnSuccess = (accountData: Account) => void;
type OnFailure = (message?: string) => void;

interface UseImportTorusAccountProps {
  onSuccess: OnSuccess;
  onFailure: OnFailure;
}

export const useImportTorusAccount = ({
  onFailure,
  onSuccess
}: UseImportTorusAccountProps) => {
  const importTorusAccount = useCallback(
    async (name: string, secretKey: string) => {
      const { secretKeyBase64, publicKeyHex } =
        parseSecretKeyStringSecp(secretKey);
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
    },
    [onFailure, onSuccess]
  );

  return { importTorusAccount };
};

export const instructionList = [
  {
    id: 1,
    header: 'Open Settings in Torus Wallet'
  },
  {
    id: 2,
    header: 'Click ‘Account Details’',
    description: 'In ‘Privacy and Security’ section'
  },
  {
    id: 3,
    header: 'Click ‘Show your private key’'
  },
  {
    id: 4,
    header: 'Click ‘Account Details’',
    description: 'You’ll need to paste it on the next screen'
  }
];
