import { convertBytesToHex, convertHexToBytes } from './utils';

// The validators throw exactly when the argument is NOT of the expected type,
// so whatever they stringify is the unexpected value — potentially secret key
// material. Saga errors now reach a visible banner, so the message must
// describe the TYPE and never the value.
describe('crypto validators — error messages never carry the value', () => {
  const SECRET = 'deadbeefcafe0123456789abcdef';

  it('convertHexToBytes rejects a non-string without echoing it', () => {
    expect(() => convertHexToBytes({ secret: SECRET } as never)).toThrow();

    try {
      convertHexToBytes({ secret: SECRET } as never);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain(SECRET);
      expect(message).toContain('expected a string');
      expect(message.toLowerCase()).toContain('object');
    }
  });

  it('convertBytesToHex rejects a hex string without echoing it', () => {
    expect(() => convertBytesToHex(SECRET as never)).toThrow();

    try {
      convertBytesToHex(SECRET as never);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain(SECRET);
      expect(message).toContain('string');
    }
  });

  it('still round-trips valid input', () => {
    expect(convertBytesToHex(convertHexToBytes('0a0b0c'))).toBe('0a0b0c');
  });

  // This is the shape that actually motivated the fix: a caller hands raw key
  // bytes to a function expecting a hex *string* (e.g. a decrypted secret key
  // reaching the wrong validator after a type confusion). With the old
  // `'arg not valid, got:' + val` concatenation, a Uint8Array/Array argument
  // invokes Array.prototype.toString/join and renders the bytes as a
  // comma-separated decimal dump — a full plaintext leak of the key material,
  // not a harmless `[object Object]`.
  it('convertHexToBytes rejects key bytes without dumping them as a decimal list', () => {
    const KEY_BYTES = Uint8Array.from([
      222, 173, 190, 239, 202, 254, 1, 35, 69, 103, 137, 171, 205, 239
    ]);
    const decimalDump = String(KEY_BYTES); // old code's Array-join rendering, e.g. "222,173,190,239,..."

    expect(() => convertHexToBytes(KEY_BYTES as never)).toThrow();

    try {
      convertHexToBytes(KEY_BYTES as never);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain(decimalDump);
      expect(message).toContain('Uint8Array');
    }
  });

  it('describeType reports "null" for null without throwing', () => {
    expect(() => convertHexToBytes(null as never)).toThrow();

    try {
      convertHexToBytes(null as never);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toMatch(/^arg not valid/);
      expect(message).toContain('null');
    }
  });

  it('describeType falls back to "object" for a prototype-less object without throwing', () => {
    const noProtoObject: unknown = Object.create(null);
    expect(() => convertHexToBytes(noProtoObject as never)).toThrow();

    try {
      convertHexToBytes(noProtoObject as never);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toMatch(/^arg not valid/);
      expect(message.toLowerCase()).toContain('object');
    }
  });
});
