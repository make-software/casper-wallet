export function privateKeyBytesToBase64(privateKeyBytes: Uint8Array): string {
  return Buffer.from(privateKeyBytes).toString('base64');
}

export function publicKeyBytesToHex(publicKeyBytes: Uint8Array): string {
  const prefix = '02';
  const publicKeyHex = Buffer.from(publicKeyBytes).toString('hex');

  return `${prefix}${publicKeyHex}`;
}

// Report the TYPE, never the value: these throw exactly when the argument is
// not what was expected, so the value in hand is the unexpected one — a secret
// key in the worst case. Saga errors reach a broadcast, user-visible banner,
// so an accidental type confusion must not render key material into a toast.
// (Not reachable under the current TypeScript contract — but the most sensitive
// caller, decrypt-message -> decryptEncryptedBase64PrivateKey, hands this
// validator a raw account secret key, so it is one type-confusion bug away.)
function describeType(val: unknown): string {
  if (val === null) return 'null';
  if (typeof val !== 'object') return typeof val;

  return val.constructor?.name ?? 'object';
}

function validateString(val: unknown): asserts val is string {
  if (typeof val === 'string' || val instanceof String) return;
  throw Error(`arg not valid, expected a string, got: ${describeType(val)}`);
}

function validateBytes(val: unknown): asserts val is Uint8Array {
  if (val != null && val && val instanceof Uint8Array) return;
  throw Error(`arg not valid, expected Uint8Array, got: ${describeType(val)}`);
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
