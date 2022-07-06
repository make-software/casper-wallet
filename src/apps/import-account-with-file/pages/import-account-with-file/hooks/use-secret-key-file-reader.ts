import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// These libraries are required for backward compatibility with Legacy Signer
import Hex from '@lapo/asn1js/hex';
import Base64 from '@lapo/asn1js/base64';
import ASN1 from '@lapo/asn1js';

import { decodeBase16, encodeBase64, decodeBase64, Keys } from 'casper-js-sdk';

import { AccountData } from '@popup/redux/vault/types';
import { checkSecretKeyExist } from '@popup/redux/remote-actions';

function getAlgorithm(content: string): 'Ed25519' | 'Secp256K1' | undefined {
  if (content.includes('curveEd25519')) {
    return 'Ed25519';
  } else if (content.includes('secp256k1')) {
    return 'Secp256K1';
  }
  return undefined;
}

type OnSuccess = (accountData: AccountData) => void;
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
    (name: string, secretKeyFile: any) => {
      const reader = new FileReader();
      reader.readAsText(secretKeyFile);

      reader.onload = async e => {
        const fileContents = reader.result as string;

        if (!fileContents || fileContents.includes('PUBLIC KEY')) {
          onFailure(
            t('A private key was not detected. Try importing a different file.')
          );

          return;
        }

        const reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
        try {
          const der: Uint8Array = reHex.test(fileContents)
            ? Hex.decode(fileContents)
            : Base64.unarmor(fileContents);

          const decodedString = ASN1.decode(der).toPrettyString();
          const algorithm = getAlgorithm(decodedString);

          if (!algorithm) {
            onFailure(
              t(
                'A private key was not detected. Try importing a different file.'
              )
            );

            return;
          }

          const hexKey =
            algorithm === 'Ed25519'
              ? decodedString.split('\n')[4].split('|')[1]
              : decodedString.split('\n')[2].split('|')[1];

          const secretKeyBase64 = encodeBase64(decodeBase16(hexKey));
          const doesSecretKeyExist =
            secretKeyBase64 && (await checkSecretKeyExist(secretKeyBase64));

          if (doesSecretKeyExist) {
            onFailure(
              t('This account already exists. Try importing a different file.')
            );

            return;
          }

          const secretKeyBytes = decodeBase64(secretKeyBase64);

          const secretKey =
            algorithm === 'Ed25519'
              ? Keys.Ed25519.parsePrivateKey(secretKeyBytes)
              : Keys.Secp256K1.parsePrivateKey(secretKeyBytes, 'raw');

          const publicKey =
            algorithm === 'Ed25519'
              ? Keys.Ed25519.privateToPublicKey(secretKeyBytes)
              : Keys.Secp256K1.privateToPublicKey(secretKeyBytes);

          const keyPair =
            algorithm === 'Ed25519'
              ? Keys.Ed25519.parseKeyPair(publicKey, secretKey)
              : Keys.Secp256K1.parseKeyPair(publicKey, secretKey, 'raw');

          onSuccess({
            name,
            secretKey: Buffer.from(keyPair.privateKey).toString(
              'base64',
              0,
              32
            ),
            publicKey: keyPair.publicKey.toHex()
          });
        } catch (e) {
          console.error(e);
          onFailure();
        }
      };
    },
    [t, onFailure, onSuccess]
  );

  return { secretKeyFileReader };
}
