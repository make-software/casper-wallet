export function privateKeyBytesToBase64(privateKeyBytes: Uint8Array): string {
  return Buffer.from(privateKeyBytes).toString('base64');
}

export function publicKeyBytesToHex(publicKeyBytes: Uint8Array): string {
  const prefix = '02';
  const publicKeyHex = Buffer.from(publicKeyBytes).toString('hex');

  return `${prefix}${publicKeyHex}`;
}

function validateString(val: unknown): asserts val is string {
  if (typeof val === 'string' || val instanceof String) return;
  throw Error('arg not valid, got:' + val);
}

function validateBytes(val: unknown): asserts val is Uint8Array {
  if (val != null && val && val instanceof Uint8Array) return;
  throw Error('arg not valid, got:' + val);
}

export function convertHexToBytes(hexString: string): Uint8Array {
  validateString(hexString);

  return Uint8Array.from(Buffer.from(hexString, 'hex'));
}

export function convertBytesToHex(bytes: Uint8Array | ArrayBuffer): string {
  validateBytes(bytes);

  return Buffer.from(bytes).toString('hex');
}

export function convertBase64ToBytes(hexString: string): Uint8Array {
  validateString(hexString);

  return Uint8Array.from(Buffer.from(hexString, 'base64'));
}

export function convertBytesToBase64(bytes: Uint8Array | ArrayBuffer): string {
  validateBytes(bytes);

  return Buffer.from(bytes).toString('base64');
}
