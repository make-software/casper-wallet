import { scryptAsync } from '@noble/hashes/scrypt';

import {
  constantTimeEqualHex,
  createScryptOptions
} from '@libs/crypto/hashing';
import { convertBytesToHex, convertHexToBytes } from '@libs/crypto/utils';

import { spawnScryptWorker } from './spawn-scrypt-worker';
import { isWorkerError } from './types';

// `scryptAsync` never returns to the event loop, so a derivation blocks its
// thread — on MV2 that is the popup's thread, and a Worker moves it off.
const canOffloadToWorker = typeof Worker !== 'undefined';

const DERIVATION_TIMEOUT_MS = 30_000;

interface ScryptResult {
  key: Uint8Array;
}

export function deriveScryptKey(
  password: string,
  saltHash: string
): Promise<Uint8Array> {
  if (!canOffloadToWorker) {
    return scryptAsync(
      password,
      convertHexToBytes(saltHash),
      createScryptOptions()
    );
  }

  return new Promise<Uint8Array>((resolve, reject) => {
    const worker = spawnScryptWorker();
    let settled = false;

    const settle = (outcome: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      outcome();
    };

    // A worker that dies without firing `onerror` would wedge the serialised
    // derivation queue until the background restarts; under the port's own 60s.
    const timer = setTimeout(
      () => settle(() => reject(Error('Key derivation timed out'))),
      DERIVATION_TIMEOUT_MS
    );

    worker.onmessage = (
      event: MessageEvent<ScryptResult | { error: true }>
    ) => {
      settle(() => {
        if (isWorkerError(event.data)) {
          reject(Error('Key derivation failed'));
          return;
        }

        resolve(event.data.key);
      });
    };

    worker.onerror = () => {
      settle(() => reject(Error('Key derivation failed')));
    };

    worker.postMessage({ password, saltHash });
  });
}

export async function encodePasswordOffThread(
  password: string,
  saltHash: string
): Promise<string> {
  return convertBytesToHex(await deriveScryptKey(password, saltHash));
}

export async function verifyPasswordOffThread(
  passwordHash: string,
  passwordSaltHash: string,
  password: string | undefined
): Promise<boolean> {
  const digest = convertBytesToHex(
    await deriveScryptKey(password || '', passwordSaltHash)
  );

  return constantTimeEqualHex(passwordHash, digest);
}
