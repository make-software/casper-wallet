import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  PROXY_CALLER_WASM_SHA256,
  base64ToBytes
} from '@libs/services/swap-service/proxy-wasm';

const wasmPath = join(__dirname, '../../../assets/wasm/proxy_caller.wasm');

describe('the vendored proxy_caller.wasm', () => {
  it('is the binary the pinned hash names', () => {
    const bytes = readFileSync(wasmPath);

    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      PROXY_CALLER_WASM_SHA256
    );
  });

  it('survives the base64 round trip the bundler puts it through', () => {
    const bytes = readFileSync(wasmPath);

    expect(base64ToBytes(bytes.toString('base64'))).toEqual(
      new Uint8Array(bytes)
    );
  });

  it('decodes empty base64 to no bytes', () => {
    expect(base64ToBytes('')).toEqual(new Uint8Array(0));
  });
});
