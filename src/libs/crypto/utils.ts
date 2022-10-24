export function privateKeyBytesToBase64(privateKeyBytes: Uint8Array): string {
  return Buffer.from(privateKeyBytes).toString('base64');
}

export function publicKeyBytesToHex(publicKeyBytes: Uint8Array): string {
  const prefix = '02';
  const publicKeyHex = Buffer.from(publicKeyBytes).toString('hex');

  return `${prefix}${publicKeyHex}`;
}
