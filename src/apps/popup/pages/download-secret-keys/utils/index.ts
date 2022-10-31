import { CLPublicKey, CLPublicKeyTag, decodeBase64, Keys } from 'casper-js-sdk';

export function downloadFile(content: Blob, filename: string): void {
  const url = window.URL.createObjectURL(content);
  const tempLink = document.createElement('a');

  tempLink.href = url;
  tempLink.setAttribute('download', filename);
  tempLink.click();
  tempLink.remove();
}

export function makeSecretKeyFileContent(
  publicKey: string,
  secretKey: string
): string {
  const clPublicKey = CLPublicKey.fromHex(publicKey);
  const decodedSecretKey = decodeBase64(secretKey);

  let keyPair;
  switch (clPublicKey.tag) {
    case CLPublicKeyTag.ED25519:
      keyPair = new Keys.Ed25519({
        publicKey: clPublicKey.value(),
        secretKey: decodedSecretKey
      });
      break;

    case CLPublicKeyTag.SECP256K1:
      keyPair = new Keys.Secp256K1(clPublicKey.value(), decodedSecretKey);
      break;

    default:
      throw Error('Unknown Signature type.');
  }

  return keyPair.exportPrivateKeyInPem();
}
