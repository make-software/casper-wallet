import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Browser from 'webextension-polyfill';

import Hex from '@lapo/asn1js/hex';
import Base64 from '@lapo/asn1js/base64';
import ASN1 from '@lapo/asn1js';
import { encodeBase64 } from 'tweetnacl-util';
import { decodeBase16, decodeBase64, Keys } from 'casper-js-sdk';

function getAlgorithm(content: string): 'Ed25519' | 'Secp256K1' | undefined {
  if (content.includes('curveEd25519')) {
    return 'Ed25519';
  } else if (content.includes('secp256k1')) {
    return 'Secp256K1';
  }
  return undefined;
}

type OnSuccess = (name: string, keyPair: Keys.Secp256K1 | Keys.Ed25519) => void;
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
          console.log("There isn't private key in file");
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
            console.log('Unknown algorithm');
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

          const isSecretKeyAlreadyImported = await Browser.runtime.sendMessage({
            type: 'check-key-is-imported',
            payload: {
              secretKeyBase64
            }
          });

          if (isSecretKeyAlreadyImported) {
            console.log('Private key is already exists');
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

          onSuccess(name, keyPair);
        } catch (e) {
          console.log(e);
          onFailure();
        }
      };
    },
    [t, onFailure, onSuccess]
  );

  return { secretKeyFileReader };
}
